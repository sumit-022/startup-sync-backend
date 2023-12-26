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
    viewed: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<false>;
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

export interface PeopleContactPerson extends Schema.Component {
  collectionName: 'components_people_contact_people';
  info: {
    displayName: 'ContactPerson';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    mobile: Attribute.String;
    landline: Attribute.String;
    mail: Attribute.Email;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'jobs.notification': JobsNotification;
      'jobs.spare': JobsSpare;
      'people.contact-person': PeopleContactPerson;
    }
  }
}
