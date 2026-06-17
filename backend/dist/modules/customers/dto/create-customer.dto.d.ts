import { CustomerSegment, CustomerType, PaymentBehavior, RiskLevel } from '@prisma/client';
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    taxId?: string;
    contact?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
    isBlocked?: boolean;
    notes?: string;
    segment?: CustomerSegment;
    customerType?: CustomerType;
    paymentBehavior?: PaymentBehavior;
    riskLevel?: RiskLevel;
}
