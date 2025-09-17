export const sleep = (
  ms: number
) => {
  return new Promise(
    (
      resolve
    ) => {
      console.log(
        ms
      );
      return setTimeout(
        resolve, ms
      );
    }
  );
};
