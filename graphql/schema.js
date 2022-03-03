const {buildSchema} = require("graphql");

module.exports = buildSchema(`
  type AuthData {
    userId: ID!
    token: String!
  }
  type Post {
    _id: ID!
    title: String!
    imageUrl: String!
    content: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }
  type GetPosts{
    posts: [Post!]!
    totalItems:Int!
  }
  type User {
    _id: ID!
    email: String!
    name: String!
    password: String!
    posts: [Post!]! 
    status: String!
  }
  
  input UserDataInput {
    email: String!
    name: String!
    password: String!
  }
  input PostDataInput{
    title: String!
    content: String!
    imageUrl: String!
  }

  type RootQuery {
    login(email: String!, password:String!): AuthData!
    getPosts(page:Int): GetPosts!
    getPost(postId:String!): Post!
  }
  type RootMutation {
    createUser(userInput: UserDataInput): User!
    createPost(postInput: PostDataInput): Post!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);