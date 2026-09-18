import type { Page, PageResponse } from '@/types/pageable';
import type {
  OrderDetail,
  OrderListFilter,
  OrderStatus,
  OrderSummary,
} from '@/schemas/orders';
import type { OrderBoardCard } from '@/schemas/order-board';
import { orderDetailSchema, orderSummarySchema } from '@/schemas/orders';
import { orderBoardCardSchema } from '@/schemas/order-board';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getMyOrders = async (
  filter: OrderListFilter,
  pagination: { page: number; size: number },
): Promise<Page<OrderSummary>> => {
  const res = await api.get<PageResponse<OrderSummary>>(API_ENDPOINTS.orders.list, {
    params: { filter, ...pagination },
  });

  return {
    ...res.data.page,
    content: res.data.content.map((item) => orderSummarySchema.parse(item)),
  };
};

export const getOrder = async (orderId: string): Promise<OrderDetail> => {
  const res = await api.get(API_ENDPOINTS.orders.detail(orderId));
  return orderDetailSchema.parse(res.data);
};

export const cancelOrder = async (orderId: string): Promise<OrderDetail> => {
  const res = await api.post(API_ENDPOINTS.orders.cancel(orderId));
  return orderDetailSchema.parse(res.data);
};

// --- Slice 7: order-management board (MANAGER/ADMIN only) ----------------------------------------------------

export const getOrderBoard = async (): Promise<Array<OrderBoardCard>> => {
  const res = await api.get(API_ENDPOINTS.orders.board);
  return orderBoardCardSchema.array().parse(res.data);
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
): Promise<OrderBoardCard> => {
  const res = await api.put(API_ENDPOINTS.orders.status(orderId), { status });
  return orderBoardCardSchema.parse(res.data);
};
