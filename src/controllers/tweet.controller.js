import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { tweetContent } = req.body;

  if (!tweetContent || !tweetContent.trim()) {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: tweetContent.trim(),
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Tweet creation failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User is required");
  }

  const twtUser = await User.findById(userId);
  if (!twtUser) {
    throw new ApiError(404, "User not found");
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        username: "$ownerDetails.username",
        fullname: "$ownerDetails.fullname",
        avatar: "$ownerDetails.avatar",
        content: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { tweet: userTweets }, "Tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { newTweetContent } = req.body;
  const { tweetId } = req.params;

  if (!tweetId || !newTweetContent || !newTweetContent.trim()) {
    throw new ApiError(400, "Tweet ID & new content are required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only the owner can update their tweets");
  }

  tweet.content = newTweetContent.trim();
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only the owner can delete their tweets");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
