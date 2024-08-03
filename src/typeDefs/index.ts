export const typeDefs = `
  type Store {
    id: Int!
    lat: Float
    lng: Float
    title: String!
  }

  type Query {
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
