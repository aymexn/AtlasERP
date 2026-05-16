DO $$ 
DECLARE 
    leaked_ids uuid[] := ARRAY['ae144f97-26c9-4c6a-b1dc-e48834f18553', '543ca8dc-9abe-4081-b9fc-32f71a7480bb']::uuid[];
BEGIN
    DELETE FROM abc_classifications WHERE company_id = ANY(leaked_ids);
    DELETE FROM stock_turnover_analytics WHERE company_id = ANY(leaked_ids);
    DELETE FROM dead_stock_items WHERE company_id = ANY(leaked_ids);
    DELETE FROM reorder_points WHERE company_id = ANY(leaked_ids);
    DELETE FROM supplier_performance_metrics WHERE company_id = ANY(leaked_ids);
    DELETE FROM stock_movement_patterns WHERE company_id = ANY(leaked_ids);
    
    DELETE FROM bom_components WHERE bom_id IN (SELECT id FROM bill_of_materials WHERE company_id = ANY(leaked_ids));
    DELETE FROM manufacturing_order_lines WHERE manufacturing_order_id IN (SELECT id FROM manufacturing_orders WHERE company_id = ANY(leaked_ids));
    DELETE FROM manufacturing_orders WHERE company_id = ANY(leaked_ids);
    DELETE FROM bill_of_materials WHERE company_id = ANY(leaked_ids);
    
    DELETE FROM stock_reception_lines WHERE reception_id IN (SELECT id FROM stock_receptions WHERE company_id = ANY(leaked_ids));
    DELETE FROM stock_receptions WHERE company_id = ANY(leaked_ids);
    
    DELETE FROM purchase_order_lines WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = ANY(leaked_ids));
    DELETE FROM purchase_orders WHERE company_id = ANY(leaked_ids);
    
    DELETE FROM stock_movements WHERE company_id = ANY(leaked_ids);
    DELETE FROM product_stocks WHERE company_id = ANY(leaked_ids);
    
    DELETE FROM sales_order_lines WHERE sales_order_id IN (SELECT id FROM sales_orders WHERE company_id = ANY(leaked_ids));
    DELETE FROM sales_orders WHERE company_id = ANY(leaked_ids);
    
    DELETE FROM payments WHERE company_id = ANY(leaked_ids);
    DELETE FROM invoices WHERE company_id = ANY(leaked_ids);
    DELETE FROM expenses WHERE company_id = ANY(leaked_ids);
    DELETE FROM products WHERE company_id = ANY(leaked_ids);
    DELETE FROM suppliers WHERE company_id = ANY(leaked_ids);
    DELETE FROM customers WHERE company_id = ANY(leaked_ids);
    DELETE FROM warehouses WHERE company_id = ANY(leaked_ids);
    DELETE FROM product_families WHERE company_id = ANY(leaked_ids);
    DELETE FROM audit_logs WHERE company_id = ANY(leaked_ids);
END $$;
