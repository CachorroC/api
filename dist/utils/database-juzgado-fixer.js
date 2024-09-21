"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(
  o, m, k, k2
) {
  if (k2 === undefined) {
    k2 = k; 
  }
  var desc = Object.getOwnPropertyDescriptor(
    m, k
  );
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function() {
      return m[ k ]; 
    } };
  }
  Object.defineProperty(
    o, k2, desc
  );
}) : (function(
  o, m, k, k2
) {
  if (k2 === undefined) {
    k2 = k; 
  }
  o[ k2 ] = m[ k ];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(
  o, v
) {
  Object.defineProperty(
    o, "default", { enumerable: true, value: v }
  );
}) : function(
  o, v
) {
  o[ "default" ] = v;
});
var __importStar = (this && this.__importStar) || function (
  mod
) {
  if (mod && mod.__esModule) {
    return mod; 
  }
  var result = {};
  if (mod != null) {
    for (var k in mod) {
      if (k !== "default" && Object.prototype.hasOwnProperty.call(
        mod, k
      )) {
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
Object.defineProperty(
  exports, "__esModule", { value: true }
);
exports.extrapolateIdCiudadyTipo = extrapolateIdCiudadyTipo;
const fs = __importStar(
  require(
    "fs/promises"
  )
);
const juzgado_1 = require(
  "../models/juzgado"
);
const carpetas_1 = require(
  "../data/carpetas"
);
const outgoingJuzgados = [];
for (const carpeta of carpetas_1.RawCarpetas) {
  const juzgadoByCarpeta = extrapolateIdCiudadyTipo(
    String(
      carpeta.JUZGADO_CIUDAD
    ), carpeta.JUZGADO_EJECUCION, carpeta.JUZGADO_ORIGEN
  );
  const juzgadoByCareta = juzgado_1.JuzgadoClass.fromShortName(
    {
      ciudad: String(
        carpeta.JUZGADO_CIUDAD
      ),
      juzgadoRaw: carpeta.JUZGADO_EJECUCION
        ? carpeta.JUZGADO_EJECUCION
        : carpeta.JUZGADO_ORIGEN
          ? carpeta.JUZGADO_ORIGEN
          : "1 CM",
    }
  );
  console.log(
    juzgadoByCarpeta
  );
  outgoingJuzgados.push(
    {
      ...juzgadoByCarpeta,
      ...juzgadoByCareta,
    }
  );
}
fs.writeFile(
  "outgoingJuzgados.json", JSON.stringify(
    outgoingJuzgados, null, 2
  )
);
function extrapolateIdCiudadyTipo(
  ciudad, ejecucion, origen
) {
  let matchedRegexNumberAndLetters;
  if (ejecucion) {
    matchedRegexNumberAndLetters = ejecucion.match(
      /(\d+)(\s?)([A-Zñúáéóí\s-]+)/im
    );
  }
  else if (origen) {
    matchedRegexNumberAndLetters = origen.match(
      /(\d+)(\s?)([A-Zñúáéóí\s-]+)/im
    );
  }
  if (matchedRegexNumberAndLetters) {
    const asAnArray = Array.from(
      matchedRegexNumberAndLetters
    );
    if (asAnArray.length === 0) {
      return {
        fullArray: JSON.stringify(
          matchedRegexNumberAndLetters
        ),
        id: "",
        tipo: "",
        ciudad: ciudad,
        value: ejecucion ? ejecucion : origen ? origen : "",
        tipoRaw: String(
          matchedRegexNumberAndLetters
        ),
      };
    }
    else if (asAnArray.length >= 2) {
      const temporaryTipo = (0, juzgado_1.extrapolateTipoToCorrectType)(
        asAnArray[ 3 ]
      );
      return {
        id: asAnArray[ 1 ],
        tipo: temporaryTipo,
        tipoRaw: asAnArray[ 3 ],
        ciudad: ciudad,
        fullArray: matchedRegexNumberAndLetters,
        value: `juzgado ${asAnArray[ 1 ].padStart(
          3, "000"
        )} ${temporaryTipo} de ${ciudad}`.toUpperCase(),
      };
    }
    const temporaryTipo = (0, juzgado_1.extrapolateTipoToCorrectType)(
      asAnArray[ 3 ]
    );
    return {
      id: asAnArray[ 1 ],
      tipo: temporaryTipo,
      tipoRaw: asAnArray[ 3 ],
      ciudad: ciudad,
      fullArray: matchedRegexNumberAndLetters,
      value: `juzgado ${asAnArray[ 1 ].padStart(
        3, "000"
      )} ${temporaryTipo} de ${ciudad}`.toUpperCase(),
    };
  }
  return {
    fullArray: null,
    id: "",
    tipo: "",
    ciudad: ciudad,
    tipoRaw: "",
    value: "",
  };
}
//# sourceMappingURL=database-juzgado-fixer.js.map