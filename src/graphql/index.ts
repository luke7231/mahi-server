export const typeDefs = `
  type Store {
    id: Int!
    lat: Float
    lng: Float
    title: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    likes: [Like!]
  }

  type Query {
    stores: [Store]
  }

  type Mutation {
    createStore(lat: Float, lng: Float, title: String!): CreateStoreResponse
  }

  type CreateStoreResponse {
    ok: Boolean!
    error: String
  }

  type User {
    id: Int!
    name: String!
    email: String!
    password: String!
    phone: String
    dateOfBirth: DateTime
    gender: String
    address: String
    createdAt: DateTime!
    updatedAt: DateTime!
    likes: [Like!]
  }

  type Query {
    users: [User!]!
    user(id: Int!): User!
  }
  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(id: Int!, data: UpdateUserInput!): User!
  }
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    phone: String
    dateOfBirth: DateTime
    gender: String
    address: String
  }
  input UpdateUserInput {
    name: String
    email: String
    password: String
    phone: String
    dateOfBirth: DateTime
    gender: String
    address: String
  }
  
  type Like {
    id: Int!
    userId: Int!
    storeId: Int!
    createdAt: DateTime!
    user: User
    store: Store
  }
  type Mutation {
    likeStore(userId: Int!, storeId: Int!): Like!
  }

  scalar DateTime
`;
