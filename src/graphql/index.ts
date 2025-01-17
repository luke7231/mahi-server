export const typeDefs = `
scalar Upload
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
    todaysProducts: [Product!]!
    distance: Float
  }

  type Query {
    store(id: Int!): Store
    stores(lat: Float, lng: Float): [Store]
    justStores: [Store]
    likedStores: [Store!]
    getSellerStore: Store
    getSellerReport: SellerReport
    getLocalAddress(lat: Float!, lng: Float!, push_token: String): String!
    getLocalAddressV2(lat: Float!, lng: Float!, push_token: String): LocalAddressResult!
  }

  type LocalAddressResult {
    loadAddr: String!
    area1: String
    area2: String
    area3: String
    area4: String
  }

  type SellerReport {
    totalCustomerCount: Int
    totalDiscountPrice: Int
    totalLikeCount: Int
    totalCarbonEmission: Float
  }

  type Mutation {
    createStore(
      lat: Float, 
      lng: Float, 
      title: String!, 
      address: String, 
      contactNumber: String, 
      closingHours: String, 
      img: Upload
    ): Store!
    updateStore(id: Int!, title: String, lat: Float, lng: Float, address: String, contactNumber: String, closingHours: String, img: Upload): Store!
  }
    
  type Product {
    id: Int!
    store: Store!
    name: String!
    price: Float!
    discountPrice: Float
    userPrice: Float
    quantity: Int!
    description: String
    saleEndTime: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    img: String
    isSoldout: Boolean
    isEnd: Boolean
    isDeleted: Boolean
    menus: [ProductMenu!]
    order: Order
    isToday: Boolean
  }

  type MenuQuantity {
    menuId: Int!
    quantity: Int!
    img: String
  }

  type Query {
    products(storeId: Int!): [Product!]!
    product(id: Int!): Product
    productsBySeller: [Product!]
    todaysProducts(storeId: Int!): [Product!]
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(input: UpdateProductInput!): Product!
    deleteProduct(id: Int!): Product!
  }
  
  input CreateProductInput {
    menus: [MenuQuantityInput!]  # 메뉴 ID와 수량을 함께 받는 구조
    name: String!
    price: Float!
    discountPrice: Float
    userPrice: Float
    quantity: Int!
    description: String
    saleEndTime: DateTime
    img: Upload
  }
  
  input MenuQuantityInput {
    menuId: Int!
    quantity: Int!
    img: String
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
    appleLogin(name: String, id_token: String!, push_token: String): appleLoginResult!
  }
  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(id: Int!, data: UpdateUserInput!): User!
    updateUserPassword(oldPassword: String!, newPassword: String!): updateUserPasswordResult!
    kakaoDeleteUser: kakaoDeleteResult
    appleDeleteUser(code: String!): appleDeleteResult
    pureSignup(email:String!, password: String!, push_token: String): pureSignResult
    pureLogin(email:String!, password: String!): pureSignResult
    pureDeleteUser: pureDeleteUserResult
  }
  type updateUserPasswordResult{ 
    ok: Boolean!
    error: String
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
 
  type Query {
    getAllVotes: [Vote!]!
    getUserVotes(userId: Int!): [Vote!]!
  }

  type Mutation {
    voteForStores(uncontractedStoreIds: [Int!]!): [Vote!]!
    cancelVote(uncontractedStoreId: Int!): Vote!
  }

  type Vote {
    id: Int!
    userId: Int!
    uncontractedStoreId: Int!
    user: User
    uncontractedStore: UncontractedStore
    createdAt: DateTime!
  } 

  type UncontractedStore {
    id: Int!
    name: String!
    category: String!
    img: String
    mainMenuImg1: String
    mainMenuImg2: String
    priceRange: String
    createdAt: DateTime!
    updatedAt: DateTime!
    votes: [Vote!]!
    voteCount: Int!
    isVoted: Boolean
  }

  type Query {
    getUncontractedStores(category: String!): [UncontractedStore!]!
    getUncontractedStore(id: Int!): UncontractedStore
  }
  scalar DateTime

  type Token {
    token: String!
    createdAt: DateTime!
  }
  type Mutation {
    createToken(data: CreateTokenInput!): Token!
    setTokenToUser(push_token: String!): Boolean!
    setTokenToSeller(push_token: String!): Boolean!
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
    isCanceled: Boolean
    user: User
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
  type MutationResponse {
    ok: Boolean!
    error: String
  }
  
  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrder(input: UpdateOrderInput!): Order!
    deleteOrder(orderId: String!): Order!
    cancelOrder(id: Int!, reason: String): MutationResponse!
  }
  type Query {
    orders: [Order!]!
    order(id: Int!): Order
    compareOrderAmount(orderId: String!, amount: Float!, paymentKey: String!, cartItems: [CartItem]): CompareOrderAmountResult! 
    sendOrderCompletionNotification(orderId: String): MutationResponse! 
  }
  input CartItem {
    product: ProductInput
    quantity: Int!
  }
  input ProductInput {
    id: Int!
  }



  type Seller {
    id: Int!
    name: String
    email: String
    contactNumber: String
    address: String
    createdAt: DateTime!
    updatedAt: DateTime!
    push_token: String
    stores: [Store!]
    bank: String
    accountHolder: String
    accountNumber: String
    businessNumber: String

  }
  
  type Query {
    seller: Seller
    sellers: [Seller!]!
  }
  
  type Mutation {
    createSeller(password: String!, contactNumber: String!): createSellerResult!
    updateSeller(name: String, email: String, contactNumber: String, address: String): Seller!
    updateSellerPassword(oldPassword: String!, newPassword: String!): updateSellerPasswordResult!
    updateSettlementInfo(
      bank: String
      accountHolder: String
      accountNumber: String
      businessNumber: String
    ): updateSettlementInfoResult!
  
    deleteSeller(id: Int!): Seller!
    sellerLogin(contactNumber: String!, password: String!, push_token: String): sellerLoginResult!
  }
  type updateSellerPasswordResult {
    ok: Boolean!
    error: String
  }
  type updateSettlementInfoResult {
    ok: Boolean!
    error: String
  }
  type sellerLoginResult {
    token: String
    error: String
  }
  type createSellerResult {
    seller: Seller!
    token: String!
  }
  
  
  type Menu {
    id: Int!
    name: String!
    price: Float!
    img: String
    store: Store!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Query {
    menu(id: Int!): Menu
    menus(storeId: Int!): [Menu!]!
  }
  
  type Mutation {
    createMenu(storeId: Int!, name: String!, price: Float!, img: Upload): Menu!
    updateMenu(id: Int!, name: String, price: Float, img: Upload): Menu!
    deleteMenu(id: Int!): Menu!
  }
  
  type Query {
    getCoords(address: String!): CoordsResponse
  }

  type CoordsResponse {
    lng: Float!
    lat: Float! 
  }

  type ProductMenu {
    id: Int
    product: Product
    productId: Int
    menu: Menu
    menuId: Int
    quantity: Int
    img: String
  }
`;
