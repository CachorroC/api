import { PlantData } from '../types/plantBase';

const plantListDB: PlantData[] = [
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : [
      'Andean Forest'
    ],
    url: 'https://www.google.com/search?q=Quercus+humboldtii&tbm=isch',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjJt8_Rt78kA-vjyLNoxTcb9CyqzhTM4w0KQ&s',
    regions: [
      'Boyacá',
      'Santander'
    ],
    scientificName: 'Quercus humboldtii',
    taxon         : {
      family : 'Fagaceae',
      genus  : 'Quercus',
      species: 'humboldtii',
    },
    commonNames: [
      'Roble colombiano',
      'Roble Andino'
    ],
  },
  {
    conservationStatus: 'Near Threatened (NT)',
    ecosystems        : [
      'Andean Forest'
    ],
    url: 'https://www.google.com/search?q=Cedrela+montana&tbm=isch',
    imageUrl:
      'https://catalogofloravalleaburra.eia.edu.co/storage/images/5937e15ea21a329476b6ff6a39cbb81df1520f16.jpg',
    regions: [
      'Antioquia',
      'Boyacá',
      'Caldas',
      'Cauca',
      'Cundinamarca',
      'Huila',
      'La Guajira',
      'Putumayo',
      'Quindío',
      'Risaralda',
      'Santander',
      'Valle del Cauca',
    ],
    scientificName: 'Cedrela montana',
    taxon         : {
      family : 'Meliaceae',
      genus  : 'Cedrela',
      species: 'montana',
    },
    commonNames: [
      'Cedro de altura',
      'Cedro rosado'
    ],
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest',
      'Subpáramo'
    ],
    url: 'https://www.google.com/search?q=Weinmannia+tomentosa&tbm=isch',
    imageUrl:
      'https://inaturalist-open-data.s3.amazonaws.com/photos/54317988/large.jpeg',
    regions       : null,
    scientificName: 'Weinmannia tomentosa',
    taxon         : {
      family : 'Cunoniaceae',
      genus  : 'Weinmannia',
      species: 'tomentosa',
    },
    commonNames: [
      'Encenillo'
    ],
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    url: 'https://www.google.com/search?q=Clusia+multiflora&tbm=isch',
    imageUrl:
      'https://plantasdecolombia.com/wp-content/uploads/2018/07/2017-07-18-15-01-49.jpg',
    regions       : null,
    scientificName: 'Clusia multiflora',
    taxon         : {
      family : 'Clusiaceae',
      genus  : 'Clusia',
      species: 'multiflora',
    },
    commonNames: [
      'Gaque',
      'Chagualo'
    ],
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : [
      'Andean Forest',
      'Subpáramo'
    ],
    url: 'https://www.google.com/search?q=Vallea+stipularis&tbm=isch',
    imageUrl:
      'https://www.picturethisai.com/wiki-image/1080/357136825710116864.jpeg',
    regions       : null,
    scientificName: 'Vallea stipularis',
    taxon         : {
      family : 'Elaeocarpaceae',
      genus  : 'Vallea',
      species: 'stipularis',
    },
    commonNames: [
      'Raque'
    ],
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Alnus_acuminata_1.jpg/250px-Alnus_acuminata_1.jpg',
    regions: [
      'Cundinamarca',
      'Boyacá',
      'Santander'
    ],
    scientificName: 'Alnus acuminata',
    taxon         : {
      family : 'Betulaceae',
      genus  : 'Alnus',
      species: 'acuminata',
    },
    commonNames: [
      'Aliso'
    ],
    url: 'https://www.google.com/search?newwindow=1&sca_esv=9a3fab58edaf9218&sxsrf=ANbL-n7cfBRBK9DoUvsDYA6kIbx1RIDxfQ:1773676064755&udm=2&fbs=ADc_l-aN0CWEZBOHjofHoaMMDiKpaEWjvZ2Py1XXV8d8KvlI3o6iwGk6Iv1tRbZIBNIVs-5-bUj3iBl-UxHsANYwOkWWQqZAJJdwuRaSoLHfELMHAYjbP4OzIxpuFsnK07afGIwi3B8T8VpsJkhCNCH8sWOr-XI14GH9Gj06XFzGoKx2Dlj56c202ih2JDekeDl74karw_0MbvEpr2qspZ3wteKy0tOR0g&q=alnus+acuminata&sa=X&sqi=2&ved=2ahUKEwjg66Se4qSTAxWWTTABHdfBMI8QtKgLegQIHhAB&biw=2016&bih=1143&dpr=1.25',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl:
      'https://www.google.com/search?q=Drimys+granadensis&tbm=isch',
    regions       : null,
    scientificName: 'Drimys granadensis',
    taxon         : {
      family : 'Winteraceae',
      genus  : 'Drimys',
      species: 'granadensis',
    },
    commonNames: [
      'Ají de páramo',
      'Canelo de Páramo'
    ],
    url: 'https://www.google.com/search?q=Drimys+granadensis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl:
      'https://www.reddearboles.org/nwlib6/includes/phpthumb/phpThumb.php?src=/imagenes/nwproject5.forms.f_productoscatalogo/1/myrcianthesleucoxylass23.jpg&w=550&f=webp',
    regions: [
      'Cundinamarca',
      'Boyacá',
      'Santander',
      'Tolima',
    ],
    scientificName: 'Myrcianthes leucoxyla',
    taxon         : {
      family : 'Myrtaceae',
      genus  : 'Myrcianthes',
      species: 'leucoxyla',
    },
    commonNames: [
      'Arrayán blanco',
      'Arrayán'
    ],
    url: 'https://www.google.com/search?q=Myrcianthes+leucoxyla&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest',
      'Subpáramo'
    ],
    imageUrl:
      'https://bs.plantnet.org/image/o/081392eacd408487213af3cc9f02db55759f1416',
    regions       : [    ],
    scientificName: 'Oreopanax bogotensis',
    taxon         : {
      family : 'Araliaceae',
      genus  : 'Oreopanax',
      species: 'bogotensis',
    },
    commonNames: [
      'Mano de oso'
    ],
    url: 'https://www.google.com/search?q=Oreopanax+bogotensis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest',
      'Subpáramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Myrsine dependens',
    taxon         : {
      family : 'Myrsinaceae',
      genus  : 'Myrsine',
      species: 'dependens',
    },
    commonNames: [
      'Cucharo de páramo'
    ],
    url: 'https://www.google.com/search?q=Myrsine+dependens&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Myrica parvifolia',
    taxon         : {
      family : 'Myricaceae',
      genus  : 'Myrica',
      species: 'parvifolia',
    },
    commonNames: [
      'Laurel de cera'
    ],
    url: 'https://www.google.com/search?q=Myrica+parvifolia&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Solanum ovalifolium',
    taxon         : {
      family : 'Solanaceae',
      genus  : 'Solanum',
      species: 'ovalifolium',
    },
    commonNames: [
      'Cucubo',
      'Tomatillo'
    ],
    url: 'https://www.google.com/search?q=Solanum+ovalifolium&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Croton bogotanus',
    taxon         : {
      family : 'Euphorbiaceae',
      genus  : 'Croton',
      species: 'bogotanus',
    },
    commonNames: [
      'Sangregado'
    ],
    url: 'https://www.google.com/search?q=Croton+bogotanus&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Andean Forest'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Smallanthus pyramidalis',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Smallanthus',
      species: 'pyramidalis',
    },
    commonNames: [
      'Arboloco'
    ],
    url: 'https://www.google.com/search?q=Smallanthus+pyramidalis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Vaccinium+floribundum&tbm=isch',
    regions       : null,
    scientificName: 'Vaccinium floribundum',
    taxon         : {
      family : 'Ericaceae',
      genus  : 'Vaccinium',
      species: 'floribundum',
    },
    commonNames: [
      'Mortiño',
      'Agráz',
      'Agraz',
      'Mortiño de páramo',
    ],
    url: 'https://www.google.com/search?q=Vaccinium+floribundum&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Gaultheria+anastomosans&tbm=isch',
    regions       : null,
    scientificName: 'Gaultheria anastomosans',
    taxon         : {
      family : 'Ericaceae',
      genus  : 'Gaultheria',
      species: 'anastomosans',
    },
    commonNames: [
      'Reventadera'
    ],
    url: 'https://www.google.com/search?q=Gaultheria+anastomosans&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Macleania rupestris',
    taxon         : {
      family : 'Ericaceae',
      genus  : 'Macleania',
      species: 'rupestris',
    },
    commonNames: [
      'Uva camarona'
    ],
    url: 'https://www.google.com/search?q=Macleania+rupestris&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Miconia+squamulosa&tbm=isch',
    regions       : null,
    scientificName: 'Miconia squamulosa',
    taxon         : {
      family : 'Melastomataceae',
      genus  : 'Miconia',
      species: 'squamulosa',
    },
    commonNames: [
      'Tuno esmeraldo'
    ],
    url: 'https://www.google.com/search?q=Miconia+squamulosa&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Bucquetia+glutinosa&tbm=isch',
    regions       : null,
    scientificName: 'Bucquetia glutinosa',
    taxon         : {
      family : 'Melastomataceae',
      genus  : 'Bucquetia',
      species: 'glutinosa',
    },
    commonNames: [
      'Saltón',
      'Charne',
      'Tuno pegajoso'
    ],
    url: 'https://www.google.com/search?q=Bucquetia+glutinosa&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Tibouchina lepidota',
    taxon         : {
      family : 'Melastomataceae',
      genus  : 'Tibouchina',
      species: 'lepidota',
    },
    commonNames: [
      'Sietecueros'
    ],
    url: 'https://www.google.com/search?q=Tibouchina+lepidota&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo',
      'Páramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Escallonia myrtilloides&tbm=isch',
    regions       : null,
    scientificName: 'Escallonia myrtilloides',
    taxon         : {
      family : 'Escalloniaceae',
      genus  : 'Escallonia',
      species: 'myrtilloides',
    },
    commonNames: [
      'Rodamonte'
    ],
    url: 'https://www.google.com/search?q=Escallonia+myrtilloides&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Baccharis+latifolia&tbm=isch',
    regions       : null,
    scientificName: 'Baccharis latifolia',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Baccharis',
      species: 'latifolia',
    },
    commonNames: [
      'Chilco común',
      'Chilco'
    ],
    url: 'https://www.google.com/search?q=Baccharis+latifolia&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Baccharis bogotensis',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Baccharis',
      species: 'bogotensis',
    },
    commonNames: [
      'Ciro'
    ],
    url: 'https://www.google.com/search?q=Baccharis+bogotensis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://google.com/search?q=Diplostephium rosmarinifolium',
    regions       : null,
    scientificName: 'Diplostephium rosmarinifolium',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Diplostephium',
      species: 'rosmarinifolium',
    },
    commonNames: [
      'Romero blanco',
      'Romero de páramo'
    ],
    url: 'https://www.google.com/search?q=Diplostephium+rosmarinifolium&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl: null,
    regions : [
      'Cundinamarca',
      'Boyacá'
    ],
    scientificName: 'Lupinus bogotensis',
    taxon         : {
      family : 'Fabaceae',
      genus  : 'Lupinus',
      species: 'bogotensis',
    },
    commonNames: [
      'Chochito',
      'Altramuz',
      'Chocho'
    ],
    url: 'https://www.google.com/search?q=Lupinus+bogotensis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Symplocos+theiformis&tbm=isch',
    regions       : null,
    scientificName: 'Symplocos theiformis',
    taxon         : {
      family : 'Symplocaceae',
      genus  : 'Symplocos',
      species: 'theiformis',
    },
    commonNames: [
      'Té de Bogotá'
    ],
    url: 'https://www.google.com/search?q=Symplocos+theiformis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Subpáramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Berberis rigidifolia',
    taxon         : {
      family : 'Berberidaceae',
      genus  : 'Berberis',
      species: 'rigidifolia',
    },
    commonNames: [
      'Espino'
    ],
    url: 'https://www.google.com/search?q=Berberis+rigidifolia&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Espeletia+grandiflora&tbm=isch',
    regions       : null,
    scientificName: 'Espeletia grandiflora',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'grandiflora',
    },
    commonNames: [
      'Frailejón gigante',
      'Frailejón Mayor'
    ],
    url: 'https://www.google.com/search?q=Espeletia+grandiflora&tbm=isch',
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl:
      'https://static.inaturalist.org/photos/39748543/large.jpg',
    regions: [
      'Cundinamarca',
      'Boyacá'
    ],
    scientificName: 'Espeletiopsis rabanalensis',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletiopsis',
      species: 'rabanalensis',
    },
    commonNames: [
      'Frailejón de Rabanal'
    ],
    url: 'https://www.google.com/search?q=Espeletiopsis+rabanalensis&tbm=isch',
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Espeletia barclayana',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'barclayana',
    },
    commonNames: [
      'Frailejón endémico'
    ],
    url: 'https://www.google.com/search?q=Espeletia+barclayana&tbm=isch',
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Espeletia murilloi',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'murilloi',
    },
    commonNames: [
      'Frailejón'
    ],
    url: 'https://www.google.com/search?q=Espeletia+murilloi&tbm=isch',
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Polylepis+quadrijuga&tbm=isch',
    regions       : null,
    scientificName: 'Polylepis quadrijuga',
    taxon         : {
      family : 'Rosaceae',
      genus  : 'Polylepis',
      species: 'quadrijuga',
    },
    commonNames: [
      'Coloradito',
      'Siete Cueros',
      'Colorado'
    ],
    url: 'https://www.google.com/search?q=Polylepis+quadrijuga&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Chusquea+tessellata&tbm=isch',
    regions       : null,
    scientificName: 'Chusquea tessellata',
    taxon         : {
      family : 'Poaceae',
      genus  : 'Chusquea',
      species: 'tessellata',
    },
    commonNames: [
      'Chusque'
    ],
    url: 'https://www.google.com/search?q=Chusquea+tessellata&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Calamagrostis+effusa&tbm=isch',
    regions       : null,
    scientificName: 'Calamagrostis effusa',
    taxon         : {
      family : 'Poaceae',
      genus  : 'Calamagrostis',
      species: 'effusa',
    },
    commonNames: [
      'Paja de páramo',
      'Pajonal',
      'Paja de páramo',
    ],
    url: 'https://www.google.com/search?q=Calamagrostis+effusa&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl:
      'https://www.google.com/search?q=Puya+nitida&tbm=isch',
    regions       : null,
    scientificName: 'Puya nitida',
    taxon         : {
      family : 'Bromeliaceae',
      genus  : 'Puya',
      species: 'nitida',
    },
    commonNames: [
      'Puya',
      'Cardón'
    ],
    url: 'https://www.google.com/search?q=Puya+nitida&tbm=isch',
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Aragoa cleefii',
    taxon         : {
      family : 'Plantaginaceae',
      genus  : 'Aragoa',
      species: 'cleefii',
    },
    commonNames: [
      'Pino de páramo'
    ],
    url: 'https://www.google.com/search?q=Aragoa+cleefii&tbm=isch',
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Scrobicaria ilicifolia',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Scrobicaria',
      species: 'ilicifolia',
    },
    commonNames: [
      'Margaritón andino'
    ],
    url: 'https://www.google.com/search?q=Scrobicaria+ilicifolia&tbm=isch',
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : [
      'Páramo'
    ],
    imageUrl      : null,
    regions       : null,
    scientificName: 'Halenia asclepiadea',
    taxon         : {
      family : 'Gentianaceae',
      genus  : 'Halenia',
      species: 'asclepiadea',
    },
    commonNames: [
      'Cachitos'
    ],
    url: 'https://www.google.com/search?q=Halenia+asclepiadea&tbm=isch',
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Espeletia+argentea&tbm=isch',
    regions       : null,
    scientificName: 'Espeletia argentea',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'argentea',
    },
    commonNames: [
      'Frailejón Plateado'
    ],
    url: 'https://www.google.com/search?q=Espeletia+argentea&tbm=isch',
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Espeletia+corymbosa&tbm=isch',
    regions       : null,
    scientificName: 'Espeletia corymbosa',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'corymbosa',
    },
    commonNames: [
      'Frailejón Liso'
    ],
    url: 'https://www.google.com/search?q=Espeletia+corymbosa&tbm=isch',
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Espeletia+grandiflora&tbm=isch',
    regions       : null,
    scientificName: 'Espeletia rabanalensis',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'rabanalensis',
    },
    commonNames: [
      'Frailejón de Rabanal'
    ],
    url: 'https://www.google.com/search?q=Espeletia+rabanalensis&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Hesperomeles+goudotiana&tbm=isch',
    regions       : null,
    scientificName: 'Hesperomeles goudotiana',
    taxon         : {
      family : 'Rosaceae',
      genus  : 'Hesperomeles',
      species: 'goudotiana',
    },
    commonNames: [
      'Mortiño',
      'Cerote'
    ],
    url: 'https://www.google.com/search?q=Hesperomeles+goudotiana&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Bejaria+resinosa&tbm=isch',
    regions       : null,
    scientificName: 'Bejaria resinosa',
    taxon         : {
      family : 'Ericaceae',
      genus  : 'Bejaria',
      species: 'resinosa',
    },
    commonNames: [
      'Pegamosco'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl          : 'https://google.com/search?q=Puya goudotiana',
    regions           : null,
    scientificName    : 'Puya goudotiana',
    taxon             : {
      family : 'Bromeliaceae',
      genus  : 'Puya',
      species: 'goudotiana',
    },
    commonNames: [
      'Cardón',
      'Puya'
    ],
    url: 'https://www.google.com/search?q=Puya+goudotiana&tbm=isch',
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Lupinus+alopecuroides&tbm=isch',
    regions       : null,
    scientificName: 'Lupinus alopecuroides',
    taxon         : {
      family : 'Fabaceae',
      genus  : 'Lupinus',
      species: 'alopecuroides',
    },
    commonNames: [
      'Chocho de páramo'
    ],
    url: 'https://www.google.com/search?q=Lupinus+alopecuroides&tbm=isch',
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Hypericum+juniperinum&tbm=isch',
    regions       : null,
    scientificName: 'Hypericum juniperinum',
    taxon         : {
      family : 'Hypericaceae',
      genus  : 'Hypericum',
      species: 'juniperinum',
    },
    commonNames: [
      'Chite',
      'Guardarocío'
    ],
    url: 'https://www.google.com/search?q=Hypericum+juniperinum&tbm=isch',
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Pentacalia+pulchella&tbm=isch',
    regions       : null,
    scientificName: 'Pentacalia pulchella',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Pentacalia',
      species: 'pulchella',
    },
    commonNames: [
      'Arnica de monte'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Gaiadendron punctatum',
    regions       : null,
    scientificName: 'Gaiadendron punctatum',
    taxon         : {
      family : 'Loranthaceae',
      genus  : 'Gaiadendron',
      species: 'punctatum',
    },
    commonNames: [
      'Tagua',
      'Fosforito'
    ],
    url: null,
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Clethra fimbriata',
    regions       : null,
    scientificName: 'Clethra fimbriata',
    taxon         : {
      family : 'Clethraceae',
      genus  : 'Clethra',
      species: 'fimbriata',
    },
    commonNames: [
      'Tibar'
    ],
    url: null,
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Paepalanthus alpinus',
    regions       : null,
    scientificName: 'Paepalanthus alpinus',
    taxon         : {
      family : 'Eriocaulaceae',
      genus  : 'Paepalanthus',
      species: 'alpinus',
    },
    commonNames: [
      'Estrella de páramo'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Pernettya prostrata',
    regions       : null,
    scientificName: 'Pernettya prostrata',
    taxon         : {
      family : 'Ericaceae',
      genus  : 'Pernettya',
      species: 'prostrata',
    },
    commonNames: [
      'Reventadera',
      'Ericácea'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Phytolacca bogotensis',
    regions       : null,
    scientificName: 'Phytolacca bogotensis',
    taxon         : {
      family : 'Phytolaccaceae',
      genus  : 'Phytolacca',
      species: 'bogotensis',
    },
    commonNames: [
      'Guaba',
      'Jaboncillo'
    ],
    url: null,
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Arcytophyllum nitidum',
    regions       : null,
    scientificName: 'Arcytophyllum nitidum',
    taxon         : {
      family : 'Rubiaceae',
      genus  : 'Arcytophyllum',
      species: 'nitidum',
    },
    commonNames: [
      'Piquito',
      'Mortiño'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Tibouchina+grossa&tbm=isch',
    regions       : null,
    scientificName: 'Tibouchina grossa',
    taxon         : {
      family : 'Melastomataceae',
      genus  : 'Tibouchina',
      species: 'grossa',
    },
    commonNames: [
      'Tuno roso',
      'Mayo'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://google.com/search?q=Oreopanax incisus',
    regions       : null,
    scientificName: 'Oreopanax incisus',
    taxon         : {
      family : 'Araliaceae',
      genus  : 'Oreopanax',
      species: 'incisus',
    },
    commonNames: [
      'Mano de Oso'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Passiflora+mixta&tbm=isch',
    regions       : null,
    scientificName: 'Passiflora mixta',
    taxon         : {
      family : 'Passifloraceae',
      genus  : 'Passiflora',
      species: 'mixta',
    },
    commonNames: [
      'Curuba de monte'
    ],
    url: null,
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl          : 'https://google.com/search?q=Salvia rufula',
    regions           : null,
    scientificName    : 'Salvia rufula',
    taxon             : {
      family : 'Lamiaceae',
      genus  : 'Salvia',
      species: 'rufula',
    },
    commonNames: [
      'Salvia roja'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Espeletia+chocontana&tbm=isch',
    regions       : null,
    scientificName: 'Espeletia chocontana',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletia',
      species: 'chocontana',
    },
    commonNames: [
      'Frailejón de Chocontá'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Espeletiopsis+corymbosa&tbm=isch',
    regions       : null,
    scientificName: 'Espeletiopsis corymbosa',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Espeletiopsis',
      species: 'corymbosa',
    },
    commonNames: [
      'Frailejón de Piedra'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Aragoa+cupressina&tbm=isch',
    regions       : null,
    scientificName: 'Aragoa cupressina',
    taxon         : {
      family : 'Plantaginaceae',
      genus  : 'Aragoa',
      species: 'cupressina',
    },
    commonNames: [
      'Romero de Páramo'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Aragoa+abietina&tbm=isch',
    regions       : null,
    scientificName: 'Aragoa abietina',
    taxon         : {
      family : 'Plantaginaceae',
      genus  : 'Aragoa',
      species: 'abietina',
    },
    commonNames: [
      'Romero'
    ],
    url: null,
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Aetanthus+mutisii&tbm=isch',
    regions       : null,
    scientificName: 'Aetanthus mutisii',
    taxon         : {
      family : 'Loranthaceae',
      genus  : 'Aetanthus',
      species: 'mutisii',
    },
    commonNames: [
      'Matapalo',
      'Injerto'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Passiflora+bogotensis&tbm=isch',
    regions       : null,
    scientificName: 'Passiflora bogotensis',
    taxon         : {
      family : 'Passifloraceae',
      genus  : 'Passiflora',
      species: 'bogotensis',
    },
    commonNames: [
      'Curuba de monte'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Mutisia+clematis&tbm=isch',
    regions       : null,
    scientificName: 'Mutisia clematis',
    taxon         : {
      family : 'Asteraceae',
      genus  : 'Mutisia',
      species: 'clematis',
    },
    commonNames: [
      'Clavellino',
      'Bejuco'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Masdevallia+coccinea&tbm=isch',
    regions       : null,
    scientificName: 'Masdevallia coccinea',
    taxon         : {
      family : 'Orchidaceae',
      genus  : 'Masdevallia',
      species: 'coccinea',
    },
    commonNames: [
      'Orquídea Banderita'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Odontoglossum+crispum&tbm=isch',
    regions       : null,
    scientificName: 'Odontoglossum crispum',
    taxon         : {
      family : 'Orchidaceae',
      genus  : 'Odontoglossum',
      species: 'crispum',
    },
    commonNames: [
      'Aguadija'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Viburnum+suratense&tbm=isch',
    regions       : null,
    scientificName: 'Viburnum suratense',
    taxon         : {
      family : 'Adoxaceae',
      genus  : 'Viburnum',
      species: 'suratense',
    },
    commonNames: [
      'Garrocho'
    ],
    url: null,
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Ceroxylon+vogelianum&tbm=isch',
    regions       : null,
    scientificName: 'Ceroxylon vogelianum',
    taxon         : {
      family : 'Arecaceae',
      genus  : 'Ceroxylon',
      species: 'vogelianum',
    },
    commonNames: [
      'Palma de Cera'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Centropogon+granulosus&tbm=isch',
    regions       : null,
    scientificName: 'Centropogon granulosus',
    taxon         : {
      family : 'Campanulaceae',
      genus  : 'Centropogon',
      species: 'granulosus',
    },
    commonNames: [
      'Campanilla'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Hypericum+goyanesii&tbm=isch',
    regions       : null,
    scientificName: 'Hypericum goyanesii',
    taxon         : {
      family : 'Hypericaceae',
      genus  : 'Hypericum',
      species: 'goyanesii',
    },
    commonNames: [
      'Chite'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Buddleja+bullata&tbm=isch',
    regions       : null,
    scientificName: 'Buddleja bullata',
    taxon         : {
      family : 'Scrophulariaceae',
      genus  : 'Buddleja',
      species: 'bullata',
    },
    commonNames: [
      'Salvia de Páramo'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl:
      'https://www.google.com/search?q=Hedyosmum+bonplandianum&tbm=isch',
    regions       : null,
    scientificName: 'Hedyosmum bonplandianum',
    taxon         : {
      family : 'Chloranthaceae',
      genus  : 'Hedyosmum',
      species: 'bonplandianum',
    },
    commonNames: [
      'Granizo'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : null,
    imageUrl          : null,
    regions           : [
      'Cundinamarca',
      'Boyacá',
      'Santander'
    ],
    scientificName: 'Myrica pubescens',
    taxon         : {
      genus  : 'Myrica',
      species: 'pubescens',
      family : null,
    },
    commonNames: [
      'Laurel de Cera'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : null,
    imageUrl          : null,
    regions           : [
      'Boyacá',
      'Santander'
    ],
    scientificName: 'Inga edulis',
    taxon         : {
      genus  : 'Inga',
      species: 'edulis',
      family : null,
    },
    commonNames: [
      'Guamo'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : null,
    imageUrl          : null,
    regions           : [
      'Santander',

    ],
    scientificName: 'Erythrina poeppigiana',
    taxon         : {
      genus  : 'Erythrina',
      species: 'poeppigiana',
      family : null,
    },
    commonNames: [
      'Bucare'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : null,
    imageUrl          : null,
    regions           : [
      'Cundinamarca',
      'Boyacá'
    ],
    scientificName: 'Erythrina edulis',
    taxon         : {
      genus  : 'Erythrina',
      species: 'edulis',
      family : null,
    },
    commonNames: [
      'Chachafruto'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : [
      'Superpáramo',
      'Páramo',
      'Subpáramo'
    ],
    imageUrl      : null,
    url           : null,
    scientificName: 'Dalea coerulea',
    regions       : [
      'Boyacá'
    ],
    taxon: {
      genus  : 'Dalea',
      species: 'coerulea',
      family : null,
    },
    commonNames: [
      'Dalea'
    ],
  },
  {
    conservationStatus: null,
    ecosystems        : null,
    imageUrl          : null,
    regions           : [
      'Cundinamarca',
      'Boyacá',
      'Santander'
    ],
    scientificName: 'Desmodium incanum',
    taxon         : {
      genus  : 'Desmodium',
      species: 'incanum',
      family : null,
    },
    commonNames: [
      'Pega Pega'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : null,
    imageUrl          : null,
    regions           : [
      'Cundinamarca',
      'Boyacá',
      'Santander'
    ],
    scientificName: 'Vicia andicola',
    taxon         : {
      genus  : 'Vicia',
      species: 'andicola',
      family : null,
    },
    commonNames: [
      'Vicia Endémica'
    ],
    url: null,
  },
  {
    conservationStatus: null,
    ecosystems        : [
      'Tropical Dry Forest'
    ],
    imageUrl: null,
    regions : [
      'Santander'
    ],
    scientificName: 'Albizia carbonaria',
    taxon         : {
      genus  : 'Albizia',
      species: 'carbonaria',
      family : null,
    },
    commonNames: [
      'Carbonero'
    ],
    url: null,
  },
  {
    conservationStatus: 'Extinct (EX)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example EX',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example EX'
    ],
    url: null,
  },
  {
    conservationStatus: 'Extinct in the Wild (EW)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example EW',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example EW'
    ],
    url: null,
  },
  {
    conservationStatus: 'Critically Endangered (CR)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example CR',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example CR'
    ],
    url: null,
  },
  {
    conservationStatus: 'Endangered (EN)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example EN',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example EN'
    ],
    url: null,
  },
  {
    conservationStatus: 'Vulnerable (VU)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example VU',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example VU'
    ],
    url: null,
  },
  {
    conservationStatus: 'Near Threatened (NT)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example NT',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example NT'
    ],
    url: null,
  },
  {
    conservationStatus: 'Least Concern (LC)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example LC',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example LC'
    ],
    url: null,
  },
  {
    conservationStatus: 'Data Deficient (DD)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example DD',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example DD'
    ],
    url: null,
  },
  {
    conservationStatus: 'Not Evaluated (NE)',
    ecosystems        : null,
    imageUrl          : null,
    regions           : [],
    scientificName    : 'example NE',
    taxon             : {
      genus  : '',
      species: '',
      family : null,
    },
    commonNames: [
      'example NE'
    ],
    url: null,
  },
];

export default plantListDB;
