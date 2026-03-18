/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import clientPromise from './services/connection/mongodb';
import { PlantData } from './types/plantBase';
import plantListDB from './assets/plantListDB';

async function upsertSpecimenToDB(
  {
    data
  }: { data: PlantData; }
) {
  try {
    const client = await clientPromise;
    const database = client.db(
      'botany_db'
    );
    const specimens = database.collection<PlantData>(
      'specimens'
    );

    const {
      _id, ...updateData
    } = data as any;

    const query = _id
      ? {
          _id: new ObjectId(
            _id
          )
        }
      : {
          scientificName: data.scientificName
        };

    const result = await specimens.findOneAndUpdate(
      query,
      {
        $set: updateData
      },
      {
        returnDocument: 'after',
        upsert        : true
      }
    );

    if ( !result ) {
      throw new Error(
        'Failed to update or create document in MongoDB.'
      );
    }

    return {
      success: true,
      data   : {
        ...result,
        _id: result._id.toString(),
      },
    };
  } catch ( error ) {
    console.error(
      'Database Error:', error
    );

    return {
      success: false,
      error  : error instanceof Error
        ? error.message
        : 'Unknown database error',
    };
  }
}

async function processBatchPlants () {
  for ( const element of plantListDB ) {
    const upsert = await upsertSpecimenToDB(
      {
        data: element
      }
    );

    if ( upsert.success ) {
      console.log(
        `successfull upsert: ${ JSON.stringify(
          upsert.data, null, 2
        ) }`
      );
    }
  }

  return;
}

await processBatchPlants();