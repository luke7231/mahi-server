export const typeDefs = `
  type Store {
    id: Int!
    lat: Float
    lng: Float
    title: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    likes: [Like!]
    isLiked: Boolean
    products: [Product!]
    address: String
    img: String
    contactNumber: String
    closingHours: String
  }

  type Query {
    store(id: Int!): Store
    stores(lat: Float, lng: Float): [Store]
    likedStores: [Store!]
  }

  type Mutation {
    createStore(lat: Float, lng: Float, title: String!): CreateStoreResponse
  }

  type CreateStoreResponse {
    ok: Boolean!
    error: String
  }

    
  type Product {
    id: Int!
    store: Store!
    name: String!
    price: Float!
    discountPrice: Float
    quantity: Int!
    description: String
    saleEndTime: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    img: String
    isSoldout: Boolean
    isEnd: Boolean
  }

  type Query {
    products(storeId: Int!): [Product!]!
    product(id: Int!): Product
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(input: UpdateProductInput!): Product!
    deleteProduct(id: Int!): Product!
  }
  input CreateProductInput {
    storeId: Int!
    name: String!
    price: Float!
    discountPrice: Float
    quantity: Int!
    description: String
    saleEndTime: DateTime
  }

  input UpdateProductInput {
    id: Int!
    name: String
    price: Float
    discountPrice: Float
    quantity: Int
    description: String
    saleEndTime: DateTime
  }



  type User {
    id: Int!
    name: String
    email: String!
    password: String
    phone: String
    dateOfBirth: DateTime
    gender: String
    address: String
    createdAt: DateTime!
    updatedAt: DateTime!
    likes: [Like!]
    push_token: String
  }

  type Query {
    users: [User!]!
    user(id: Int!): User!
    kakaoLogin(code: String!, client_id: String!, redirect_url: String!, push_token: String): kakaoLoginResult!
    appleLogin(id_token: String!, push_token: String): appleLoginResult!
  }
  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(id: Int!, data: UpdateUserInput!): User!
    kakaoDeleteUser: kakaoDeleteResult
    appleDeleteUser(code: String!): appleDeleteResult
    pureSignup(email:String!, password: String!, push_token: String): pureSignResult
    pureLogin(email:String!, password: String!): pureSignResult
    pureDeleteUser: pureDeleteUserResult
  }
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    phone: String
    dateOfBirth: DateTime
    gender: String
    address: String
    push_token: String
  }
  input UpdateUserInput {
    name: String
    email: String
    password: String
    phone: String
    dateOfBirth: DateTime
    gender: String
    address: String
    push_token: String
  }
  type kakaoLoginResult {
    user: User
    token: String!
  }
  type appleLoginResult{
    user: User
    token: String!
  }
  type kakaoDeleteResult {
    ok: Boolean!
    error: String
  }
  type appleDeleteResult {
    ok: Boolean!
    error: String
  }
  type pureSignResult {
    user: User
    token: String!
  }
  type pureDeleteUserResult {
    ok: Boolean!
    error: String
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
    likeStore(storeId: Int!): Like!
    cancelLike(storeId: Int!): Like!
  }

  scalar DateTime

  type Token {
    token: String!
    createdAt: DateTime!
  }
  type Mutation {
    createToken(data: CreateTokenInput!): Token!
    setTokenToUser(push_token: String!): Boolean!
  }
  input CreateTokenInput {
    token: String!
  }



  type Order {
    id: Int!
    orderId: String!
    amount: Float!
    coupon: String
    products: [Product!]!
    createdAt: DateTime
    updatedAt: DateTime
    totalQuantity: Int!
    totalDiscount: Float! 
    isApproved: Boolean
  }
  input CreateOrderInput {
    orderId: String!
    amount: Float!
    totalQuantity: Int!
    totalDiscount: Float!
    coupon: String
    productIds: [Int!]!  # Product IDs 리스트를 입력받음
  }
  input UpdateOrderInput {
    id: Int!
    orderId: String
    amount: Float
    coupon: String
    productIds: [Int!]
  }
  type CompareOrderAmountResult {
    ok: Boolean!
    error: String
  }
  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrder(input: UpdateOrderInput!): Order!
    deleteOrder(orderId: String!): Order!
  }
  type Query {
    orders: [Order!]!
    order(id: Int!): Order
    compareOrderAmount(orderId: String!, amount: Float!, paymentKey: String!, cartItems: [CartItem]): CompareOrderAmountResult! 
  }
  input CartItem {
    product: ProductInput
    quantity: Int!
  }
  input ProductInput {
    id: Int!
  }
`;
