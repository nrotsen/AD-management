import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { compare } from "bcrypt";

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        const { email, password } = credentials;

        try {
          const userCommand = new GetCommand({
            TableName: "Admins",
            Key: { adminId: "123" },
          });

          const { Item: admin } = await dynamoDbClient.send(userCommand);

          if (!admin) {
            throw new Error("Email incorrecto");
          }

          const isValidPassword = await compare(password, admin.password);

          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }

          return {
            id: admin.adminId,
            name: admin.username,
            email: admin.email,
          };
        } catch (error) {
          console.error("Error durante la autenticación", error);
          throw new Error("Credenciales incorrectas"); // Mensaje de error genérico
        }
      },
    }),
  ],
  pages: {
    signIn: "/", // Tu página de login
    error: "/", // Aquí puedes definir la página donde quieres que se muestren los errores
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
