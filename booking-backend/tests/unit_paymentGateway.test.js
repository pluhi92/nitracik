const axios = require('axios');
const querystring = require('querystring');

jest.mock('axios');

const paymentGateway = require('../services/paymentGateway');

const CREATE_URL = 'https://payments.comgate.cz/v1.0/create';
const STATUS_URL = 'https://payments.comgate.cz/v1.0/status';
const REFUND_URL = 'https://payments.comgate.cz/v1.0/refund';

beforeAll(() => {
  process.env.COMGATE_MERCHANT = 'test-merchant';
  process.env.COMGATE_SECRET = 'test-secret';
  process.env.COMGATE_TEST = 'true';
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('paymentGateway Comgate integration', () => {
  describe('createPayment', () => {
    test('posiela spravne Comgate parametre a vracia transId s redirect URL', async () => {
      axios.post.mockResolvedValueOnce({
        data: 'code=0&transId=ABC123&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fstart%2FABC123',
      });

      const result = await paymentGateway.createPayment({
        priceEur: 15,
        refId: 'booking-123',
        label: 'Detske plavanie',
        returnUrl: 'https://example.test/success',
        email: 'user@example.com',
      });

      expect(result).toEqual({
        transId: 'ABC123',
        redirectUrl: 'https://payments.comgate.cz/start/ABC123',
      });
      expect(axios.post).toHaveBeenCalledWith(
        CREATE_URL,
        expect.any(String),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const params = querystring.parse(axios.post.mock.calls[0][1]);
      expect(params).toMatchObject({
        merchant: 'test-merchant',
        secret: 'test-secret',
        test: 'true',
        price: '1500',
        curr: 'EUR',
        refId: 'booking-123',
        method: 'ALL',
        country: 'SK',
        lang: 'sk',
        email: 'user@example.com',
        prepareOnly: 'true',
        returnUrl: 'https://example.test/success',
      });
      expect(params.label).toBe('Detske plavanie');
    });

    test('skracuje label na maximalne 16 znakov', async () => {
      axios.post.mockResolvedValueOnce({ data: 'code=0&transId=ABC123&redirect=https%3A%2F%2Fexample.test' });

      await paymentGateway.createPayment({
        priceEur: 10,
        refId: 'label-test',
        label: '12345678901234567890',
      });

      const params = querystring.parse(axios.post.mock.calls[0][1]);
      expect(params.label).toBe('1234567890123456');
      expect(params.label).toHaveLength(16);
    });

    test.each([
      [15.005, '1501'],
      [10.001, '1000'],
      [0.1, '10'],
    ])('zaokruhluje cenu %p EUR na %s centov', async (priceEur, expectedPrice) => {
      axios.post.mockResolvedValueOnce({ data: 'code=0&transId=ROUND&redirect=https%3A%2F%2Fexample.test' });

      await paymentGateway.createPayment({ priceEur, refId: 'rounding-test', label: 'Test' });

      const params = querystring.parse(axios.post.mock.calls[0][1]);
      expect(params.price).toBe(expectedPrice);
    });

    test('vyhodi Error pri neuspesnom Comgate create response', async () => {
      axios.post.mockResolvedValueOnce({ data: 'code=110&message=Invalid+request' });

      await expect(
        paymentGateway.createPayment({ priceEur: 15, refId: 'failed-create', label: 'Test' })
      ).rejects.toThrow('Comgate createPayment error: Invalid request (code 110)');
    });
  });

  describe('getPaymentStatus', () => {
    test('parsuje URL-encoded Comgate response', async () => {
      axios.post.mockResolvedValueOnce({ data: 'code=0&status=PAID&fee=0' });

      await expect(paymentGateway.getPaymentStatus('ABC123')).resolves.toBe('PAID');
      expect(axios.post).toHaveBeenCalledWith(
        STATUS_URL,
        expect.any(String),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const params = querystring.parse(axios.post.mock.calls[0][1]);
      expect(params).toEqual({
        merchant: 'test-merchant',
        secret: 'test-secret',
        transId: 'ABC123',
      });
    });

    test('vyhodi Error pri neuspesnom Comgate status response', async () => {
      axios.post.mockResolvedValueOnce({ data: 'code=404&message=Transaction+not+found' });

      await expect(paymentGateway.getPaymentStatus('MISSING'))
        .rejects.toThrow('Comgate getPaymentStatus error: Transaction not found (code 404)');
    });
  });

  describe('refundPayment', () => {
    test('posiela spravnu sumu v centoch a vracia uspesny vysledok', async () => {
      axios.post.mockResolvedValueOnce({ data: 'code=0' });

      await expect(paymentGateway.refundPayment('ABC123', 12.34, 'refund-123'))
        .resolves.toEqual({ ok: true });
      expect(axios.post).toHaveBeenCalledWith(
        REFUND_URL,
        expect.any(String),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const params = querystring.parse(axios.post.mock.calls[0][1]);
      expect(params).toMatchObject({
        merchant: 'test-merchant',
        secret: 'test-secret',
        test: 'true',
        transId: 'ABC123',
        amount: '1234',
        curr: 'EUR',
        refId: 'refund-123',
      });
    });

    test('vracia neuspesny vysledok pri odmietnutej refundacii', async () => {
      axios.post.mockResolvedValueOnce({ data: 'code=120&message=Refund+rejected' });

      await expect(paymentGateway.refundPayment('ABC123', 15.005, 'refund-failed'))
        .resolves.toEqual({ ok: false, message: 'Refund rejected', code: '120' });

      const params = querystring.parse(axios.post.mock.calls[0][1]);
      expect(params.amount).toBe('1501');
    });
  });
});
