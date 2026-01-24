function test(
  n 
) {
  if ( n < 0 ) {
    return false;
  }

  const single_digit = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];

  const double_digit = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const below_hundred = [
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  if ( n === 0 ) {
    return 'Zero';
  }

  function translate(
    n: number 
  ) {
    let word = '';

    if ( n < 10 ) {
      word = single_digit[ n ] + ' ';
    } else if ( n < 20 ) {
      word = double_digit[ n - 10 ] + ' ';
    } else if ( n < 100 ) {
      const rem = translate(
        n % 10 
      );

      word = below_hundred[ ( n - ( n % 10 ) ) / 10 - 2 ] + ' ' + rem;
    } else if ( n < 1000 ) {
      word
        = single_digit[ Math.trunc(
          n / 100 
        ) ] + ' Hundred ' + translate(
          n % 100 
        );
    } else if ( n < 1000000 ) {
      word
        = translate(
          parseInt(
            n / 1000 
          ) 
        )
          .trim()
        + ' Thousand '
        + translate(
          n % 1000 
        );
    } else if ( n < 1000000000 ) {
      word
        = translate(
          parseInt(
            n / 1000000 
          ) 
        )
          .trim()
        + ' Million '
        + translate(
          n % 1000000 
        );
    } else {
      word
        = translate(
          parseInt(
            n / 1000000000 
          ) 
        )
          .trim()
        + ' Billion '
        + translate(
          n % 1000000000 
        );
    }

    return word;
  }

  const result = translate(
    n 
  );

  return result.trim() + '.';
}

let n = 175480.78;
console.log(
  'Number n = ' + n 
);
console.log(
  'In word: ' + test(
    n 
  ) 
);
n = 1279;
console.log(
  'Number n = ' + n 
);
console.log(
  'In word: ' + test(
    n 
  ) 
);
n = 127900;
console.log(
  'Number n = ' + n 
);
console.log(
  'In word: ' + test(
    n 
  ) 
);
n = 1279000;
console.log(
  'Number n = ' + n 
);
console.log(
  'In word: ' + test(
    n 
  ) 
);
