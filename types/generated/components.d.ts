import type { Schema, Attribute } from '@strapi/strapi';

export interface JobsNotification extends Schema.Component {
  collectionName: 'components_jobs_notifications';
  info: {
    displayName: 'notification';
    icon: 'bell';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    body: Attribute.Text;
    timestamp: Attribute.DateTime & Attribute.Required;
  };
}

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
      'jobs.notification': JobsNotification;
      'jobs.spare': JobsSpare;
    }
  }
}
