import mongoose, { isValidObjectId, Mongoose } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  /*
  1. Get tweet content from body and validate
  2. Create tweet in database and validate
  */

  const { tweetContent } = req.body;
  if (!tweetContent) {
    throw new ApiError(400, "tweet content is required");
  }

  const tweet = await Tweet.create({
    content: tweetContent,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "tweet creation failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  /*
  1. Get user ID from params, then validate
  2. Find all tweets in DB that has the owner = user ID, then validate
  3. Return these tweet IDs
  */
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
  /*
  1. Get Tweet ID and content and validate
  2. Find the tweet in the database from the ID and validate
  3. Check if the user logged in = owner in database 
  4. If yes, update the tweet content
  */
  const { newTweetContent } = req.body;
  const { tweetId } = req.params;

  if (!tweetId || !newTweetContent.trim()) {
    throw new ApiError(400, "Tweet ID & New content is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const tweetOwner = tweet?.owner;
  const loggedInUser = req.user?._id;

  if (tweetOwner.toString() !== loggedInUser.toString()) {
    throw new ApiError(403, "Only the owner can delete their tweets");
  }

  tweet.content = newTweetContent.trim();
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(204, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  /*
  1. Get Tweet ID and validate
  2. Find the tweet in the database from the ID and validate
  3. Check if the user logged in = owner in database 
  4. If yes, delete
  */

  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const tweetOwner = tweet?.owner;
  const loggedInUser = req.user?._id;

  if (tweetOwner.toString() !== loggedInUser.toString()) {
    throw new ApiError(403, "Only the owner can delete their tweets");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res.status(204).send();
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
