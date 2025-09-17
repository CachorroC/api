'use strict';
Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);
exports.ClassDeudor = exports.Tel = void 0;

class Tel {
  fijo;
  celular;
  constructor( telefono ) {
    const celularStringArray = telefono.match( /\d{10}/g );

    const fijoStringArray = telefono.match( /\d{7}\s/g );

    const celularNumber = celularStringArray?.map( ( f ) => {
      return String( f );
    } );

    const fijoNumber = fijoStringArray?.map( ( f ) => {
      return String( f );
    } );

    this.fijo = fijoNumber
      ? fijoNumber[ 0 ]
      : null;
    this.celular = celularNumber
      ? celularNumber[ 0 ]
      : null;
  }
}
exports.Tel = Tel;

class ClassDeudor {
  constructor( rawCarpeta ) {
    const {
      DEMANDADO_IDENTIFICACION: cedula, DEMANDADO_DIRECCION: direccion, DEMANDADO_EMAIL: email, DEMANDADO_TELEFONOS: telefono, DEMANDADO_NOMBRE: nombre, NUMERO: id, 
    } = rawCarpeta;

    this.id = Number( id );
    this.cedula = String( cedula );
    this.direccion = direccion
      ? direccion.toString()
      : null;
    this.email = email
      ? email.toString()
      : null;

    const {
      fijo, celular 
    } = new Tel( String( telefono ) );

    this.telCelular = celular;
    this.telFijo = fijo;

    const nameStringArray = nombre
      ? nombre.trim()
        .split( ' ' )
      : 'Nelson Nuñez'.split( ' ' );

    const nameArrayLength = nameStringArray.length;

    switch ( nameArrayLength ) {
        case 4:
          [
            this.primerNombre,
            this.segundoNombre,
            this.primerApellido,
            this.segundoApellido,
          ] = nameStringArray;
          break;

        case 2:
          [
            this.primerNombre,
            this.primerApellido
          ] = nameStringArray;
          this.segundoApellido = null;
          this.segundoNombre = null;
          break;

        case 1:
          [
            this.primerNombre
          ] = nameStringArray;
          this.primerApellido = 'sinEspecificar';
          this.segundoApellido = null;
          this.segundoNombre = null;
          break;

        case 3:
          [
            this.primerNombre,
            this.segundoNombre,
            this.primerApellido
          ]
                    = nameStringArray;
          this.segundoApellido = null;
          break;
        default:
          [
            this.primerNombre,
            this.segundoNombre,
            this.primerApellido,
            this.segundoApellido,
          ] = nameStringArray;
          break;
    }
  }
  id;
  telCelular;
  telFijo;
  primerNombre;
  segundoNombre;
  primerApellido;
  segundoApellido;
  cedula;
  direccion;
  email;
  static prismaDeudor( deudor ) {
    const newDeudor = {
      id             : deudor.id,
      cedula         : deudor.cedula,
      primerApellido : deudor.primerApellido,
      primerNombre   : deudor.primerNombre,
      direccion      : deudor.direccion,
      email          : deudor.email,
      segundoApellido: deudor.segundoApellido,
      segundoNombre  : deudor.segundoNombre,
      telCelular     : deudor.telCelular,
      telFijo        : deudor.telFijo,
    };

    return newDeudor;
  }
}
exports.ClassDeudor = ClassDeudor;
//# sourceMappingURL=deudor.js.map