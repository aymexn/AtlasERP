UPDATE stock_receptions SET status = 'DRAFT' WHERE reference = 'REC-202605-0001';
UPDATE purchase_orders SET status = 'SENT' WHERE reference = 'BCF-202605-0001';
UPDATE purchase_order_lines SET received_qty = 0 WHERE purchase_order_id = (SELECT id FROM purchase_orders WHERE reference = 'BCF-202605-0001');
