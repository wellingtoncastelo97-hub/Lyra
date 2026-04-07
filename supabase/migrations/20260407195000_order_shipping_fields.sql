alter table public.orders
    add column if not exists shipping_method text,
    add column if not exists shipping_label text,
    add column if not exists shipping_cost numeric(10, 2) not null default 0;
