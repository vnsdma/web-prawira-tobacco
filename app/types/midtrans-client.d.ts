declare module 'midtrans-client' {
    export interface MidtransConfig {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    }
  
    export interface TransactionDetails {
      order_id: string;
      gross_amount: number;
    }
  
    export interface CustomerDetails {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      [key: string]: any;
    }
  
    export interface ItemDetails {
      id?: string;
      price: number;
      quantity: number;
      name: string;
      [key: string]: any;
    }
  
    export interface SnapParameter {
      transaction_details: TransactionDetails;
      customer_details?: CustomerDetails;
      item_details?: ItemDetails[];
      credit_card?: {
        secure: boolean;
        [key: string]: any;
      };
      [key: string]: any;
    }
  
    export class Snap {
      constructor(options: MidtransConfig);
      createTransaction(parameter: SnapParameter): Promise<{
        token: string;
        redirect_url: string;
      }>;
      transaction: {
        notification(notificationJson: any): Promise<{
          order_id: string;
          transaction_status: string;
          fraud_status: string;
          [key: string]: any;
        }>;
      };
    }
  
    export class CoreApi {
      constructor(options: MidtransConfig);
      charge(parameter: any): Promise<any>;
      capture(parameter: any): Promise<any>;
    }
  
    const midtransClient: {
      Snap: typeof Snap;
      CoreApi: typeof CoreApi;
    };
  
    export default midtransClient;
  }