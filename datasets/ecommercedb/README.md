# ECommerceDB Dataset Reference

## Overview
A realistic digital commerce database encompassing multi-country customers, self-referential product categories, catalog inventory, shopping orders, line items, multi-rail payments, and user customer reviews.

## Tables & Relationships
- `customers` (customer_id PK)
- `categories` (category_id PK, parent_category_id FK -> categories [Self-referential hierarchy])
- `products` (product_id PK, category_id FK -> categories)
- `orders` (order_id PK, customer_id FK -> customers)
- `order_items` (order_item_id PK, order_id FK -> orders, product_id FK -> products)
- `payments` (payment_id PK, order_id FK -> orders)
- `reviews` (review_id PK, product_id FK -> products, customer_id FK -> customers)

## Intentional Edge Cases Tested
1. **Dormant / Non-purchasing Customers:** `customer_id = 10` ('Zoe Kovacs') has never placed an order, testing anti-joins (`LEFT JOIN ... WHERE orders.order_id IS NULL`).
2. **Unordered Products:** `product_id = 11` ('Bluetooth Portable Speaker') exists in catalog with inventory but has zero orders.
3. **Product Reviews Distribution:** Some products have zero reviews, requiring `COALESCE(AVG(rating), 0)`.
4. **Order Status Filtering:** Orders have statuses `completed`, `refunded`, and `cancelled`. Queries measuring revenue must deliberately filter out cancelled/refunded transactions.
5. **Multi-level Categories:** Root categories have `parent_category_id IS NULL`, testing recursive CTE queries and hierarchical joins.
