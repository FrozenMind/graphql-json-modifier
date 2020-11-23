let express = require('express')
let {
  graphqlHTTP
} = require('express-graphql')
let {
  buildSchema
} = require('graphql')
let graphqlTools = require('graphql-tools')

let fs = require('fs')

let countries = JSON.parse(fs.readFileSync('data/countries.json'))

// Construct a schema, using GraphQL schema language
let schema = `
  type Query {
    countries(first: Int!, offset: Int = 0): [Country]
    country(name: String): CountryOrError
  }

  type Mutation {
    createCountry(country: CountryInput): Country
  }

  union CountryOrError = Country | Error

  type Countries {
    countries: [Country]
  }

  type Country {
    id: Int
    name: String,
    nativeName: String,
    topLevelDomain: [String],
    alpha2Code: String,
    numericCode: String,
    alpha3Code: String,
    currencies: [String],
    callingCodes: [String],
    capital: String,
    altSpellings: [String],
    relevance: String,
    region: String,
    subregion: String,
    language: [String],
    languages: [String],
    translations: Translation,
    population: Int,
    latlng: [Float],
    demonym: String,
    borders: [String],
    area: Int,
    gini: Float,
    timezones: [String]
  }

  input CountryInput {
    name: String,
    capital: String
  }

  type Translation {
    de: String,
    es: String,
    fr: String,
    it: String,
    ja: String,
    nl: String,
    hr: String
  }

  type Error {
    status: Int,
    message: String
  }
`

let resolvers = {
  CountryOrError: {
    __resolveType: (obj, context, info) => {
      return obj.message ? "Error" : "Country"
    }
  }
}

// The root provides a resolver function for each API endpoint
let root = {
  /*
  {
    countries(first: 10, offset: 80) {
      name,
      region,
      translations {
        de
      }
    }
  }
  */
  countries: (param) => {
    console.log('countriesPaginated', param)
    return countries.slice(param.offset, param.offset + param.first);
  },
  /*
  {
    country(name:"Germany") {
      __typename
      ... on Country {
        name,
        region,
        language
      },
      ... on Error {
        message
      }
    }
  }
   */
  country: (param) => {
    console.log('country', param)
    let c = countries.find(c => c.name.toLowerCase() === param.name.toLowerCase())
    if (c) {
      return c
    }
    return {
      status: 404,
      message: `Country ${param.name} not found`
    }
  },
  createCountry: (param) => {
    console.log('createCountry', param)
    countries.push(param.country)
    param.country.id = 4732832
    return param.country
  }
}

let app = express()
app.use('/graphql', graphqlHTTP({
  schema: graphqlTools.makeExecutableSchema({
    typeDefs: schema,
    resolvers: resolvers
  }),
  rootValue: root,
  graphiql: true,
}))
app.get('/countries', (req, res) => {
  console.log('HTTP countries');
  res.json(countries.slice(req.query.offset, req.query.offset + req.query.first))
})
app.listen(4000, () => console.log('Express GraphQL Server Now Running On localhost:4000/graphql'))
