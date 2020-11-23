type Query {
  countries(first: Int!, offset: Int = 0): [Country]
  country(name: String): CountryOrError
}

type Mutation {
  createCountry(country: CountryInput): Country
}

union CountryOrError = Country | Error

type Country {
  id: Int
  name: String,
  latlng: [Float],
  translations: Translation
}
