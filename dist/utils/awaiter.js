'use strict';
Object.defineProperty(
  exports, '__esModule', {
    value: true,
  } 
);
exports.sleep = void 0;

const sleep = (
  ms 
) => {
  return new Promise(
    (
      resolve 
    ) => {
      console.log(
        ms 
      );
      return setTimeout(
        resolve, ms * 10 
      );
    } 
  );
};

exports.sleep = sleep;
//# sourceMappingURL=awaiter.js.map
