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

export interface JobsQuantity extends Schema.Component {
  collectionName: 'components_jobs_quantities';
  info: {
    displayName: 'quantity';
    icon: 'chartCircle';
    description: '';
  };
  attributes: {
    value: Attribute.Decimal;
    unit: Attribute.String;
    unitDescription: Attribute.Text;
  };
}

export interface JobsRfqForm extends Schema.Component {
  collectionName: 'components_jobs_rfq_forms';
  info: {
    displayName: 'RFQForm';
    icon: 'information';
    description: '';
  };
  attributes: {
    shipName: Attribute.String & Attribute.Required;
    RFQNumber: Attribute.String & Attribute.Required & Attribute.Unique;
    SpareDetails: Attribute.Component<'jobs.spare-details', true>;
    vendors: Attribute.Relation<
      'jobs.rfq-form',
      'oneToMany',
      'api::vendor.vendor'
    > &
      Attribute.Private;
    description: Attribute.Text;
  };
}

export interface JobsSpareDetails extends Schema.Component {
  collectionName: 'components_jobs_spare_details';
  info: {
    displayName: 'SpareDetails';
    description: '';
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    quantity: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    description: Attribute.Text;
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

export interface JobsSparesQuote extends Schema.Component {
  collectionName: 'components_jobs_spares_quotes';
  info: {
    displayName: 'SparesQuote';
  };
  attributes: {
    SpareDetails: Attribute.Component<'jobs.spare-details'>;
    rate: Attribute.Integer;
    amount: Attribute.Integer;
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
    secondarymails: Attribute.JSON;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'jobs.notification': JobsNotification;
      'jobs.quantity': JobsQuantity;
      'jobs.rfq-form': JobsRfqForm;
      'jobs.spare-details': JobsSpareDetails;
      'jobs.spare': JobsSpare;
      'jobs.spares-quote': JobsSparesQuote;
      'people.contact-person': PeopleContactPerson;
    }
  }
}
