'use strict';
var __createBinding = ( this && this.__createBinding ) || ( Object.create
  ? ( function(
      o, m, k, k2 
    ) {
      if ( k2 === undefined ) {
        k2 = k;
      }

      var desc = Object.getOwnPropertyDescriptor(
        m, k 
      );

      if ( !desc || ( 'get' in desc
        ? !m.__esModule
        : desc.writable || desc.configurable ) ) {
        desc = {
          enumerable: true,
          get       : function() {
            return m[ k ]; 
          } 
        };
      }

      Object.defineProperty(
        o, k2, desc 
      );
    } )
  : ( function(
      o, m, k, k2 
    ) {
      if ( k2 === undefined ) {
        k2 = k;
      }

      o[ k2 ] = m[ k ];
    } ) );
var __setModuleDefault = ( this && this.__setModuleDefault ) || ( Object.create
  ? ( function(
      o, v 
    ) {
      Object.defineProperty(
        o, 'default', {
          enumerable: true,
          value     : v 
        } 
      );
    } )
  : function(
    o, v 
  ) {
    o[ 'default' ] = v;
  } );

var __importStar = ( this && this.__importStar ) || function (
  mod 
) {
  if ( mod && mod.__esModule ) {
    return mod;
  }

  var result = {};

  if ( mod != null ) {
    for ( var k in mod ) {
      if ( k !== 'default' && Object.prototype.hasOwnProperty.call(
        mod, k 
      ) ) {
        __createBinding(
          result, mod, k 
        );
      }
    }
  }

  __setModuleDefault(
    result, mod 
  );
  return result;
};

var __importDefault = ( this && this.__importDefault ) || function (
  mod 
) {
  return ( mod && mod.__esModule )
    ? mod
    : {
        'default': mod 
      };
};

Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);
exports.RawCarpetas = void 0;

const xlsx_1 = __importDefault(
  require(
    'xlsx' 
  ) 
);

const fs = __importStar(
  require(
    'fs/promises' 
  ) 
);

const workbook = xlsx_1.default.readFile(
  '/home/cachorro_cami/OneDrive/bases_de_datos/general.xlsx', {
    cellDates: true,
  } 
);

const {
  SheetNames, Sheets 
} = workbook;

const mapperSheets = SheetNames.flatMap(
  (
    sheetname 
  ) => {
    const sheet = Sheets[ sheetname ];

    const tableSheet = xlsx_1.default.utils.sheet_to_json(
      sheet 
    );
    return tableSheet.map(
      (
        table 
      ) => {
        return {
          ...table,
          category: sheetname,
        };
      } 
    );
  } 
);
exports.RawCarpetas = [
  ...mapperSheets
].sort(
  (
    a, b 
  ) => {
    const x = a.NUMERO;

    const y = b.NUMERO;

    if ( x < y ) {
      return -1;
    } else if ( x > y ) {
      return 1;
    }

    return 0;
  } 
);
fs.writeFile(
  'carpetas.json', JSON.stringify(
    exports.RawCarpetas, null, 2 
  ) 
);
//# sourceMappingURL=carpetas.js.map