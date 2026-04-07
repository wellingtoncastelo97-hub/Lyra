import nacexLogo from '../../assets/checkout/nacex.png';
import correosExpressLogo from '../../assets/checkout/correos-express.png';
import dpdLogo from '../../assets/checkout/dpd.png';

export const shippingOptions = [
  {
    id: 'nacex_home',
    carrier: 'NACEX',
    label: 'Ao domicilio',
    subtitle: 'Nao valido para as ilhas · 24 a 48 horas',
    price: 5.2,
    logo: nacexLogo,
  },
  {
    id: 'nacex_pickup',
    carrier: 'NACEX',
    label: 'Ponto de recolha',
    subtitle: 'Sera entregue ao ponto de recolha mais proximo da sua morada.',
    price: 4.06,
    logo: nacexLogo,
  },
  {
    id: 'correos_home',
    carrier: 'Correos Express',
    label: 'Ao domicilio',
    subtitle: 'PAQ24 · 24 a 48 horas',
    price: 4.93,
    logo: correosExpressLogo,
  },
  {
    id: 'correos_pickup',
    carrier: 'Correos Express',
    label: 'Ponto de recolha',
    subtitle: 'Sera entregue ao ponto de recolha mais proximo da sua morada.',
    price: 4.93,
    logo: correosExpressLogo,
  },
  {
    id: 'dpd_pickup',
    carrier: 'DPD',
    label: 'Ponto de recolha PICK UP',
    subtitle: 'ES · PT · 24 a 48 horas',
    price: 4.16,
    logo: dpdLogo,
  },
];

export const getShippingOptionById = (id) =>
  shippingOptions.find((option) => option.id === id) || null;
