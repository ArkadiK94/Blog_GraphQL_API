const {buildSchema} = require("graphql");

module.exports = buildSchema(`
  type LoggedIn {
    _id: ID!
    token: String!
  }
  type RootQuery {
    login(email: String!, password:String!): LoggedIn!
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
  type RootMutation {
    createUser(userInput: UserDataInput): User!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);