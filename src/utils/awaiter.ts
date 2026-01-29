export const sleep = ( ms: number ) => {
  return new Promise( ( resolve ) => {
    console.log( `🛌 sleeping ${ ms } ${ new Date()
      .toString() } 😴` );

    return setTimeout(
      resolve, ms
    );
  } );
};
