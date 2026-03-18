export type ConservationStatus =
  | 'Vulnerable (VU)'
  | 'Near Threatened (NT)'
  | 'Least Concern (LC)'
  | 'Not Evaluated (NE)'
  | 'Endangered (EN)'
  | 'Extinct (EX)'
  | 'Extinct in the Wild (EW)'
  | 'Critically Endangered (CR)'
  | 'Data Deficient (DD)';

export type Ecosystem =
//? Páramos
  | 'Páramo'
  | 'Superpáramo'
  | 'Subpáramo'
  //? Andean Forest
  | 'Andean Forest'
  | 'High Andean Forest'
  | 'Andean Cloud Forest'
  | 'Sub-Andean Forest'
//? Tropical Rainforest | Tropical Dry Forests
  | 'Tropical Rainforest'
  | 'Tropical Dry Forest'
  | 'Xerophytic Scrub'
//? Xerophytic Formations
  | 'Desert'
  | 'Seasonal Savanna'
  | 'Flooded Savanna'
//? Alluvial|Gallery Forests
  | 'Gallery Forest'
  | 'Alluvial Forest'
  | 'Mangrove'

  | 'Coral Reef'
  | 'Seagrass Meadow'
  | 'Coastal Lagoon'

  | 'Estuary'
  | 'Sandy Beach'
  | 'Rocky Shore'

  | 'Pelagic Zone'
  | 'Abyssal Zone'
  | 'Lentic Water System'

  | 'Lotic Water System'
  | 'Peatland'
  | 'Insular Ecosystem';


export type Regions =
  | 'Amazonas'
  | 'Antioquia'
  | 'Arauca'
  | 'Atlántico'
  | 'Bolívar'
  | 'Boyacá'
  | 'Caldas'
  | 'Caquetá'
  | 'Casanare'
  | 'Cauca'
  | 'Cesar'
  | 'Chocó'
  | 'Córdoba'
  | 'Cundinamarca'
  | 'Guainía'
  | 'Guaviare'
  | 'Huila'
  | 'La Guajira'
  | 'Magdalena'
  | 'Meta'
  | 'Nariño'
  | 'Norte de Santander'
  | 'Putumayo'
  | 'Quindío'
  | 'Risaralda'
  | 'San Andrés y Providencia'
  | 'Santander'
  | 'Sucre'
  | 'Tolima'
  | 'Valle del Cauca'
  | 'Vaupés'
  | 'Vichada';

export interface Taxon {
  family : null | string;
  genus  : string;
  species: string;
}

// To parse this data:
//
//   import { Convert } from "./file";
//
//   const plantData = Convert.toPlantData(json);

export interface PlantData {
  conservationStatus: ConservationStatus | null;
  ecosystems        : Ecosystem[] | null;
  url               : string | null;
  imageUrl          : null | string;
  regions           : null | Regions[];
  scientificName    : string;
  taxon             : Taxon;
  commonNames       : string[];
}

// Converts JSON strings to/from your types
export class Convert {
  public static toPlantData(
    json: string 
  ): PlantData {
    return JSON.parse(
      json 
    );
  }

  public static plantDataToJson(
    value: PlantData 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toTaxon(
    json: string 
  ): Taxon {
    return JSON.parse(
      json 
    );
  }

  public static taxonToJson(
    value: Taxon 
  ): string {
    return JSON.stringify(
      value 
    );
  }
}
