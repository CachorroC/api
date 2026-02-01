
import { RobustApiClient } from '../utils/fetcher';
import { client } from './prisma';

async function sincronizarProcesoJuridico() {
  try {
    // PASO 1: Obtener el último 'consDocumento' procesado.
    // Ordenamos por consDocumento descendente para obtener el mayor.
    const ultimaActuacion = await client.actuacion.findFirst( {
      orderBy: {
        consActuacion: 'desc',
      },
    } );

    // Si no hay registros, empezamos desde 0
    const ultimoConsecutivo = ultimaActuacion
      ? ultimaActuacion.consDocumento
      : 0;

    console.log( `Iniciando sincronización desde consecutivo: ${ ultimoConsecutivo }` );

    const requestApi = new RobustApiClient();

    // PASO 2: Fetch al API Jurídico
    const respuesta = await ( 'https://api-juridica.com/proceso/123/actuaciones' );

    if ( !respuesta.ok ) {
      throw new Error( `Error API origen: ${ respuesta.statusText }` );
    }

    const datosApi = await respuesta.json();
    // Estructura esperada: [{ id: "xyz", consDocumento: 101, ... }, ...]

    // PASO 3: Filtrar usando consDocumento
    // Solo nos interesan los que tengan un consecutivo MAYOR al que tenemos en BD
    const nuevasActuaciones = datosApi
      .filter( item => {
        return item.consDocumento > ultimoConsecutivo;
      } )
      // Opcional: Asegurar que se procesen en orden (del 101 al 105, no al revés)
      .sort( (
        a, b
      ) => {
        return a.consDocumento - b.consDocumento;
      } );

    if ( nuevasActuaciones.length === 0 ) {
      console.log( 'Todo está actualizado.' );

      return;
    }

    console.log( `Detectadas ${ nuevasActuaciones.length } nuevas actuaciones.` );

    // PASO 4: Procesar (Loop)
    for ( const actuacion of nuevasActuaciones ) {

      // A. POST al segundo endpoint (Webhook)
      const notificacion = await fetch(
        'https://api-destino.com/webhook/nuevo-evento', {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( actuacion )
        }
      );

      if ( !notificacion.ok ) {
        console.error( `Fallo al notificar consDocumento ${ actuacion.consDocumento }. Deteniendo para reintentar luego.` );

        // Break crítico: si falla uno, paramos para no romper la secuencia lógica
        break;
      }

      // B. Guardar en Postgres
      await prisma.actuacion.create( {
        data: {
          id_externo   : String( actuacion.id ), // Guardamos el ID original por referencia
          consDocumento: actuacion.consDocumento, // Guardamos el consecutivo para la próxima sync
          fecha        : new Date( actuacion.fecha ),
          descripcion  : actuacion.descripcion
        }
      } );

      console.log( `--> Guardado consecutivo: ${ actuacion.consDocumento }` );
    }

  } catch ( error ) {
    console.error(
      'Error en el proceso de sincronización:', error
    );
  } finally {
    await prisma.$disconnect();
  }
}

sincronizarProcesoJuridico();