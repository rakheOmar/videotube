// const asyncHandler = (requestHandler) => {
//   return (req, res, next) => {
//     Promise.resolve(requestHandler(req, res, next)).catch((error) => {
//       next(error);
//       // If you want to handle the error here instead of passing it to the next middleware
//       res.status(error.code || 500).json({
//         success: false,
//         message: error.message || "Internal Server Error",
//       });
//     });
//   };
// };

// export { asyncHandler };

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
