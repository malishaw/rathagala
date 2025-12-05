/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import {
  organization,
  twoFactor,
  admin as adminPlugin,
  openAPI,
  bearer
} from "better-auth/plugins";
import { ac, admin, member, owner } from "./permissions";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb"
  }),
  plugins: [
    twoFactor(),
    adminPlugin(),
    openAPI(),
    bearer(),
    organization({
      ac: ac,
      roles: {
        member,
        admin,
        owner
      },

      allowUserToCreateOrganization(user) {
        // Allow all authenticated users to create organizations
        return !!user;
      },

      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;

        console.log({ inviteLink });

        // TODO: implement sending email functionality

        // TODO: Implement sending notification functionality
      }
    })
  ],
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false
      },
      phone: {
        type: "string",
        required: false
      },
      whatsappNumber: {
        type: "string",
        required: false
      },
      province: {
        type: "string",
        required: false
      },
      district: {
        type: "string",
        required: false
      },
      city: {
        type: "string",
        required: false
      },
      location: {
        type: "string",
        required: false
      }
    }
  }
});

export type Session = typeof auth.$Infer.Session;
