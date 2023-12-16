import type { Schema, Attribute } from '@strapi/strapi';

export interface JobsSpare extends Schema.Component {
  collectionName: 'components_jobs_spares';
  info: {
    displayName: 'spare';
    icon: 'shoppingCart';
  };
  attributes: {
    title: Attribute.String;
    make: Attribute.String;
    model: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'jobs.spare': JobsSpare;
    }
  }
}
