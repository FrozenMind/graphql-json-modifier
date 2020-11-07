let express = require('express');
let {
  graphqlHTTP
} = require('express-graphql');
let {
  buildSchema
} = require('graphql');
let graphqlTools = require('graphql-tools');

let fs = require('fs');

let champions = JSON.parse(fs.readFileSync('data/champions.json'))

// Construct a schema, using GraphQL schema language
let schema = `
  type Query {
    getChampionByName(name: String): ChampionOrNotFound
    getChampionsByTag(tag: String): ChampionArrOrNotFound
    getChampionsByStatGte(name: String, value: Float): ChampionArrOrNotFound
  }

  union ChampionOrNotFound = Champion | NotFoundError
  union ChampionArrOrNotFound = Champions | NotFoundError

  type Champion {
    id: String
    key: String
    name: String
    title: String
    tags: [String]
    stats: Stats
    icon: String
    sprite: Sprite
    description: String
  }

  type Champions {
    champions: [Champion]
  }

  type Sprite {
    url: String
    x: Int
    y: Int
  }

  type Stats {
    hp: Float
    hpperlevel: Float
    mp: Float
    mpperlevel: Float
    movespeed: Float
    armor: Float
    armorperlevel: Float
    spellblock: Float
    spellblockperlevel: Float
    attackrange: Float
    hpregen: Float
    hpregenperlevel: Float
    mpregen: Float
    mpregenperlevel: Float
    crit: Float
    critperlevel: Float
    attackdamage: Float
    attackdamageperlevel: Float
    attackspeedperlevel: Float
    attackspeed: Float
  }

  type NotFoundError {
    message: String
  }
`

let resolvers = {
  ChampionOrNotFound: {
    __resolveType: (obj, context, info) => {
      return obj.message ? "NotFoundError" : "Champion"
    }
  },
  ChampionArrOrNotFound: {
    __resolveType: (obj, context, info) => {
      return obj.message ? "NotFoundError" : "Champions"
    }
  }
}

// The root provides a resolver function for each API endpoint
let root = {
  /*
    {
      getChampionByName(name:"Ahri") {
        __typename
        ... on Champion {
          name,
          stats {
            hp,
            armor,
            attackdamage,
            attackspeedperlevel
          }
        },
        ... on NotFoundError {
          message
        }
      }
    }
   */
  getChampionByName: (param) => {
    console.log('getChampionByName', param);
    let champ = champions.find(c => c.name.toLowerCase() === param.name.toLowerCase())
    if (champ) {
      return champ
    }
    return {
      message: `Champion ${param.name} not found`
    }
  },
  /*
    {
      getChampionsByTag(tag:"Tank") {
        __typename
        ... on Champions {
          champions {
            name,
        		title,
            tags
          }
        }
        ... on NotFoundError {
          message
        }
      }
    }
   */
  getChampionsByTag: (param) => {
    console.log('getChampionsByTag', param);
    let foundChampions = champions.filter(c => c.tags.indexOf(param.tag) >= 0)
    if (foundChampions.length > 0) {
      return {
        champions: foundChampions
      }
    }
    return {
      message: `No champion found for tag ${param.tag}`
    }
  },
  /*
    {
      getChampionsByStatGte(name:"hp", value:650) {
        __typename
        ... on Champions {
          champions {
            name,
            title,
            stats {
              hp
            }
          }
        }
        ... on NotFoundError {
          message
        }
      }
    }
   */
  getChampionsByStatGte: (param) => {
    console.log('getChampionsByStatGte', param)
    let foundChampions = champions.filter(c => c.stats[param.name] >= param.value)
    if (foundChampions.length > 0) {
      return {
        champions: foundChampions
      }
    }
    return {
      message: `No champions found with ${param.name} >= ${param.value}`
    }
  }
};

let app = express();
app.use('/graphql', graphqlHTTP({
  schema: graphqlTools.makeExecutableSchema({
    typeDefs: schema,
    resolvers: resolvers
  }),
  rootValue: root,
  graphiql: true,
}));
app.listen(4000, () => console.log('Express GraphQL Server Now Running On localhost:4000/graphql'));
