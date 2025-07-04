import React from "react";
import { DocusealForm } from '@docuseal/react';

export default function DocusealDatenschutzForm({ src, email, onComplete }) {
  return (
    <div className="docuseal-datenschutz-form">
      <DocusealForm
        src={src}
        email={email}
        onComplete={onComplete}
      />
    </div>
  );
}
