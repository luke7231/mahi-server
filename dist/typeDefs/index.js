export const typeDefs = `
  type Book {
    title: String
    author: String
  }

  type Store {
    id: Int!
    lat: Float
    lng: Float
    title: String!
  }

  type Query {
    books: [Book]
    stores(id: Int!): [Store]
  }
  
  type Mutation {
    createStore(lat: Float, lng: Float, title: String!): CreateStoreResponse
  }

  type CreateStoreResponse {
    ok: Boolean!
    error: String
  }
`;
