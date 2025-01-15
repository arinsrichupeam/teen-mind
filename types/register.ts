import { Address, Profile } from "@prisma/client";

export type Register = {
    register_profile: Profile,
    register_address: Address
}