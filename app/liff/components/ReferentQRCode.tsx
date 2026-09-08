"use client";

import React from "react";
import { Affiliation, Volunteer, VolunteerType } from "@prisma/client";

import { ReferentQRCodeModal } from "../register/referent/components";

interface ReferentQRCodeProps {
  affiliation: Affiliation[];
  data: Volunteer;
  volunteerType: VolunteerType[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReferentQRCode: React.FC<ReferentQRCodeProps> = ({
  affiliation,
  data,
  volunteerType,
  isOpen,
  onClose,
}) => {
  return (
    <ReferentQRCodeModal
      affiliation={affiliation}
      data={data}
      isOpen={isOpen}
      volunteerType={volunteerType}
      onClose={onClose}
    />
  );
};
