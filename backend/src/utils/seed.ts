/**
 * Seed Script — npm run seed
 * ---------------------------
 * Populates the MongoDB Atlas database with:
 *   1. All menu items from the original mock dataset
 *   2. Category tiles for the homepage
 *   3. Customer reviews / testimonials
 *   4. The singleton SiteContent document (images, contact info)
 *   5. The admin user (credentials from .env)
 *
 * Safe to run multiple times — uses upsert for all data so re-running
 * updates existing records instead of duplicating them.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import {
  MenuItem,
  Category,
  Review,
  SiteContent,
  Admin,
  hashPassword,
  SITE_CONTENT_SINGLETON_ID
} from '../models/index.js';

/* ------------------------------------------------------------------ */
/* Seed data (mirrors frontend/src/mockData.ts)                        */
/* ------------------------------------------------------------------ */

const MENU_ITEMS = [
  { _id: 'lotus-cheesecake', name: 'Lotus Biscoff Cheesecake', price: 12.50, category: 'Cheesecakes', description: 'Our signature creamy cheesecake with a crunchy Lotus base and golden speculoos spread.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-naKsMgOZXn6Fw5kl9qLD1QJtKSQo1es3hyzA0j_ZZzjHYGpLEs-AeOHo2S3f6UovcxXFa6UD1ys1aeI1gwbpxrvyCkuFNgbAWB-B0F5qxv9qj_wn_MpZ36o4v_q4yU_v983y7Mr5EmpVK14tHqAMfgA0XydV4bqajAvGIJcBvdR0S77yQjK3yRDOQAT8vfTETEuG9hPfxz-kKHWesyVzn-G5YfoJ9BzoLqqDHYNr4INBKS2Sr0c_AS0polIANLGg0sBmLaVYRox5', isPopular: true, ingredients: ['Lotus Biscoff crumbs', 'Belgian cream cheese', 'brown butter', 'vanilla bean'], tags: ['Popular', 'Desserts'] },
  { _id: 'sig-latte', name: 'Signature Latte', price: 5.80, category: 'Coffee', description: 'Rich single-origin espresso balanced with silky smooth steamed milk and delicate foam art.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpMl11Mx4iWntTqoaOj8gF4aw6eXUTtKmplkMv0-BC6Dlz39AhQtUZ1PX3vyBRnxzAZHsdiR5LaY9o2B_zzt9iCBOeNiHYH9EVJvkyin3OyhL6nuoOWeSYcvslJWymOBRgT2WyN_9Lkzc4N9Cmcs_wUbPHgsL-7XhzcM97jkrE_JFmU5-af9_2KA3Wv56vfmAV9ZUB2XxLyO5MLOfn57LTUoFu8kr27WUo4LlIaZ5ELFYVn06Sd9jCnZtM3NMp_0ZTKwUQdMjMaHSO', ingredients: ['Single-origin Arabica beans', 'micro-foamed organic milk', 'hint of cocoa dust'], tags: ['Popular'] },
  { _id: 'berry-pancakes', name: 'Berry Cloud Pancakes', price: 14.20, category: 'Pancakes', description: 'Ultra-fluffy soufflé pancakes topped with seasonal macerated berries and velvety cream.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIUTkYmGt8iBX83Y8rGPgDanQAs7YN-88EEDihT2pS_ZIs14P8VfDIf9w2DHXbK3LbnT37fpkLerANZ68H9lVqkeK-4aEaPUapdofKa5iPVmxQLubjkSzx8TWzfvLXZTakHTbKd8FlFpt2xymWG9wKePnUwEeu26BdiFs1Gvh2sV0LxBtzvPkfbTHJZ9-CQgYeEPmuzm1D0i65eOM-1f5LuDZnETH462nHRbTMCW565RznZVAsZSFYtfw8z5CvbTbMarDaJf-i-WF3', ingredients: ['Soufflé pancake batter', 'organic strawberries', 'Canadian maple syrup', 'clotted cream'], tags: ['Desserts'] },
  { _id: 'iced-mocha', name: 'Velvet Iced Mocha', price: 6.50, category: 'Cold Coffee', description: 'Premium Swiss dark chocolate blended with our signature roast and chilled milk over ice.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADt0awTMf0Z3LrkEn3D6jhApTuzZpt94WSRSAHhyjICdyac9tQidtaBKxQrVArWZL7Sc7GhYKrQ1AcqqU2FTzgoM7llxB80Dez4NtR9g4xwMFZ8lZXGhBrqEPu_HNk2fgqwZ9UNfAfR7be556y9WYasL6e6mgMVmRl_PG1bQeT2fB-gjaTydirJe-O4VeY4FJw1DyTzYbqpHXjH2BOjsV3E2oYvHPX8dK3jgsv3A-57Zp0imGtnBnc1E00h5aGxQxCoRk7hIV-gVb4', ingredients: ['Cold espresso extract', 'premium cocoa fudge', 'organic whole milk', 'whipped topping'], tags: ['Gluten Free'] },
  { _id: 'truffle-fries', name: 'Truffle Parlour Fries', price: 9.00, category: 'Fries', description: 'Hand-cut golden fries infused with white truffle oil and aged parmesan reggiano.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEkoLhZSKKRUjGBiK80XlrbEW-h536XO4RWEmGdcWS5tSMoFM8E-m_1_XmThV9nc2vCwYZtpRZDpzh7NqLJaf43WhroJ5BX48PchSTrX_9Z4UEOi4_ufg-LxM1UO7N_ksy4D_D5FKHzE2GPb1RZeA3CQQ6vqhfQ99ge4YWcq1L-HnE35JEpcN24L6KocFk6gqsWqxJBkNAFGzHhCObxbWLX3K4yXFHRoSiQ_veR6PfUfhHsKbFb9WWHOvxG5qU6DFkHjglj0noQjzi', ingredients: ['Hand-cut Idaho potatoes', 'white truffle oil', 'parmesan reggiano', 'garlic aioli'], tags: ['Snacks'] },
  { _id: 'lava-cake', name: 'Meltaro Lava Cake', price: 11.00, category: 'Bakery Specials', description: 'A warm chocolate masterpiece with a molten center of 70% dark Belgian cocoa.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwejgdRAql0-u-LeTRfMCLMuWbg_0CHnzb4danbDGOZG1DL2e_uL4eG-4CKwvdxnu1EaHevCgQQdxH24Xsh4j8ElfTR4jVZvRrGXXgB7z_SeG9cm2zIHFxGGCKY82XYMlLDyH59rI59Vx0b6pHsNtMEeSM-7iNQWTWsBPLQuYwM7CMCn4XcwgJ8jjIpfTvE7Z0o7Ac9v48cm6zRlt74gEJ6ycErwUoU_gHU_p6MeQYPk0GX1prAGhNDYbiL3eRP0TCCOd_wl3ZWPV7', isPopular: true, ingredients: ['70% Belgian chocolate', 'organic eggs', 'Madagascar vanilla', 'fresh raspberries'], tags: ['Popular', 'Desserts'] },
  { _id: 'honey-croissant', name: 'Honey Glazed Croissant', price: 6.50, category: 'Pastries', description: 'Artisanal flaky croissant, twice-baked and finished with organic wildflower honey glaze.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9lhz-Yfjc0oqmO4_kbCMGrPRkwW5eAOKHUyJ1v7fL9IVO22Jhy0MUFLF9I-HptfWYHzOGcJao22s3ihye02PuCpyUQ4C_PhLKaRFKN2gM2Xs58em_Qzozp78HjM_atbu93cBeCACB8HFe8gYX5Mwsspr8kydaKIO7blZN7E58O4cNL62Yw8w9fjoyCLOdSlUdFt9VKV8bPUwObhFjomEJmYW_aozqe1SHrwM-HDMA8itJIM4M4GKGbzBdlP0qnvVjGOgv8YjRQWkb', ingredients: ['Laminated croissant dough', 'wildflower honey', 'French churned butter', 'egg wash'], tags: ['Snacks'] },
  { _id: 'dark-cake', name: 'Forest Dark Cake', price: 9.00, category: 'Seasonals', description: 'Decadent slice of dark cocoa sponge infused with a wild mountain forest berry reduction.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZIusRqfuWGYnYVfON89mkAkmjrqaYg9xccG3-vPuW3Y9WcgPReYfaXPb6Yv8y6ck2eruVOoSj7fA9q9mBewJCUZUuS_By4k5Jls0HxDLpFHZkPT631gdizmumqBV16uUPhsnd4j8kl75nLLCI1g7gASQNcwxj61PuDkx8r4qXd0O8QIgGoGHy4uPv4qFlp0vMtLMWN54TmIzeYPUXmCbIkIRwsPucs83L2MnyjjpP0zUhuB-vdZhl_gvhR3MsYjrNzNYQId1pEGqg', ingredients: ['70% cocoa dark chocolate ganache', 'forest blackberry reduction', 'edible gold leaf'], tags: ['Desserts'] },
  { _id: 'sourdough', name: 'Heritage Sourdough', price: 12.00, category: 'Artisan Sourdough', description: '36-hour slow-fermented crusty artisan loaf baked to golden perfection with an open crumb.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYfs2AHfQ7mXoxN7NX4tIyIUC-weme0dLVxpLozelUhh-Z4eha7aZ7Cllvb6OOLJDZFmZQa_2g_1xe5F7RG5QJjYvpO85CtHrHS_3M0-e_FP0QFi1KhXb7Fo3VyqbP0EpBZkDTif8dxeHOThY7AD8HD4dYrqHPs4YMzro1I9RdtmGfnS9drVAtVaHddyI_N028Q8dVm8EdT-vcwC3VoQruTe-JfUX1WVCu3vRatVIRsCi8rMEfXCo7x998apiO5Eh9hoTPbIpzCOiG', ingredients: ['Stoneground organic wheat', 'natural wild yeast culture starter', 'spring water', 'sea salt'], tags: ['Gluten Free', 'Snacks'] },
  { _id: 'macarons', name: 'Pistachio Macarons', price: 18.00, category: 'Pastries', description: 'A deluxe gift box of 6 premium hand-piped macarons filled with Sicilian pistachio ganache.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqqFVCxysLY4XiRgLb0BpuWsyXQ0gB-7kzsFwYPDViEMoxbixa5bT6GVPJ3hnb1qPJzsPnuH09vP0TlrlFL1yDTHB0dbvNgE4DFfaYJ6tzwg6eMd3xqoGnH7Qv3CJ28sw3Z9C14jm-Pdo2RmV5yxD-giYTiz7SWIoUoIHPdBuSfUC_cUEYOv_ngLZ6ot-hCI1CKKB692X0SxwVxzF9r2rP3E-q1QCuEBIB-5Y6Ma6VsVd9CajYr4-Sr-9pvpXQp23k4-bromJPbsYn', ingredients: ['Premium almond meal', 'egg whites', 'roasted Sicilian pistachios', 'white chocolate cream'], tags: ['Desserts', 'Gluten Free'] },
  { _id: 'chocolate-shake', name: 'Belgian Chocolate Shake', price: 7.25, category: 'Shakes', description: 'Imported Belgian dark chocolate blended with our signature vanilla bean base for ultimate richness.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxVm0BcobBOOzjN_CwlzqI2UMQ9jJ5S_d7xFpvTCaWgLP3UtqdHkFd3dxS1Q7GgUcGQbULNdWpxDVOTikeYS24M0xWIddR5tL6HqDXkhtqEtkw4dYT7twdoJKbFXryDbKDaq0s6xt6mQdqbBVeYpg1__LgdUv99LLB_U7XaRLbkSjGjF7wyTu5UIIsCxMhb--4Buv8cCHYnuPTnjr12I3dFLqrn7fEQkzgofLAJlxqVUb9NAmH4Ki', isPopular: false, ingredients: ['Premium dark Belgian chocolate', 'organic vanilla bean ice cream', 'double cream'], tags: ['Popular', 'Desserts', 'Gluten Free'] },
  { _id: 'nutella-pancakes', name: 'Nutella Pancakes', price: 9.75, category: 'Pancakes', description: 'Triple-stacked buttermilk pancakes drizzled generously with warm hazelnut cocoa spread and fresh strawberries.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzVlcc9L5S9Qmsa73ZCQMc0azMJLUW9A3pf3X6iSxilxOUbR51gq0SIwu468DuWhxifyWue0otrZ1Qq428QByJuT7vhq7nT126T_yOQJ-5yyBHF8vDlXg5FRHwi_FhsJulFBwj4c4z6eIylEIWYpvizaKxZMWYQQHhK43DjfVdjfKjLODzTKbx_7Zx8PJHnFUQHUK8MpF8d4Y-VjfP05RJOEtryWCQwHBSEVhY1k6ntlVAVCdps7VwCsgkjg10alEbteW7d6jM4HxI', ingredients: ['High-rise buttermilk pancake stack', 'Nutella hazelnut spread', 'fresh strawberries', 'toasted forest hazelnuts'], tags: ['Popular', 'Desserts'] }
];

const CATEGORIES = [
  { name: 'Coffee', sub: 'Single Origin Beans', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpVUl2sOjNO3rPhW4B3CJZ8CX0rPWi9w_MmGqTbARsHw8ebkv0q7PQIL_E_UmJlvmSEEyxt16v3_yzxGWja83RnRMu7XjkPMKAE3rRyEey3QsyBLFF2zk1_jgf2PCa4BSRalJnayIidp63Sv32UWEdgf05pQUXvzgMPqs7iZ7ZBxiLrf8RdmMKLQ6OIFGcsU7m2MQpnLwWsWdQDWR_35-ZEwBTnRrHoVxCfM8bm7u_i1T-zCobQGwavwKd6vynE4qsC_j8wCT7Kdcz', order: 0 },
  { name: 'Shakes', sub: 'Velvety Indulgence', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe7aoYuylrPbhuzNfVVBtLwtI9PBzS9TYMm81-tEAhCt7t8qEYWoYy1YznLA6t6y4tpFPop6nQVmd5V_QJQ_2YUgURQ2aa9jrJmt-oo2_gE1toCNZupUUwQdXeTgY9TNY9UZ6g6Nqfsh4IxUo6TDkssA5vHsHpcM1cZB9scZgC61SQIZqdGvD7lIuuy6dOBIoj7jRlBAmaRephqkSVagOQr1XFHG2GjYvyvhxfYTMXMnnHDEajFKTLzL93uOCaRjuw5jJsfgoRBw2k', order: 1 },
  { name: 'Cakes', sub: 'Baked to Perfection', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTLEMdNk-AETtZsTSne6Zoa9S17cFuoQH9cq2bGOve_vmbvfPNRFoJcmqRV_v_EUDxpYp04_MrbEwwsDYdL7wfQ1PZgu2bkX8sVpvt1a9wvMsWaqbMDAFqeEXjSO0a-7T7ugyIF56kX8O00LyyAtnYZNX2AB4ApU6lMDCiPFdItvKB_3EGJoISIsB7B6G6CsWZ2M5STCg0tjkCADqu5BcOrd2-Z1N3tTkwd95mrsIfuBjB9CLCHU5Aji88ITYyoKzMHjalpJapkTa6', order: 2 },
  { name: 'Bakery', sub: 'Seasonal Delights', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmdDBU8NJtQYzecgmPAeEaup-TSb3F9lI5Xt53v9ybRTfs2FLQ314GOgFFl1EZ4mhNADzbj5yNVOuuNkW7qZ5hyV4MgTMvQHB51WRZhFhQAn4RkLYVWGI3b6h9N_SyrxI6xZrSgowfEqpmGIErkPjEnbAI66TdpHhXDelqO12jhjChrHStCofAghpV908VnCyAnvm_gKVBwKmJitmeYjQb6f2onbVcbG9H-IGmfsQSsARC8UoMyRvBFHPKxSa235fiYlIAS_Ett_xg', order: 3 }
];

const REVIEWS = [
  { quote: "Meltaro is not just a bakery; it's a sensory escape. The outdoor setting combined with the best cheesecake I've ever tasted makes it my favourite weekend ritual.", author: 'Elena Richardson', role: 'Food Critic & Regular Guest', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTLa1WBKI9qRprBLnpv3C4K9cfx5HLtqf03Z9cFIJb4Ji8KN-1fJMZsivM2fyp49QUx-eNTk7NoGZjg-Fe_QzbVLZxlHtUkMzSoskAoas5LBHdHyebiojsEjyvPyXv1_FJpGbc5DrpJQY9AHLXpO0iz-IxBJPkH6xmYVS6MPmc7jzEcRHZ3oYTyEs4opaEZvQrcOi6Dap43-VpWXQpQj0w_L-dJvySZ_A2rgOgJuruVOIrhm35eAN3ojqgNuiAwEl9302XEPLXlS4g', isPublished: true },
  { quote: "The Heritage Sourdough is absolutely outstanding. A perfect shatteringly crisp crust with an incredibly tender crumb. Savoring this with a hot Signature Latte is heaven.", author: 'Marcus Sterling', role: 'Artisan Bread Enthusiast', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', isPublished: true },
  { quote: "The car-hop service is pure magic! Placing my order, driving in beneath the pines, and having Mello bring out a fresh box of Pistachio Macarons feels so cinematic.", author: 'Sophia Laurent', role: 'Regular Connoisseur', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', isPublished: true }
];

const SITE_CONTENT = {
  _id: SITE_CONTENT_SINGLETON_ID,
  mascotUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABvDDbu2Zkaqp4Maw_LkwLTnX24dhytB2nnkWVB5uAd1yWpFKm7H9JTYfZc-Y1CoLAM_sJa2os9s9tt4oBXzM0gPm43ivL6bHgGc2yOHhe-IxQbAtkzPmjZqZL_zo2Lzz0aBDGEwu5BJEeZPwkCKR0ld-GH5mR42PSI3VPrehO8utie67DO0SqXSv3L5nFTqfI42aGxIwDEoqvwZU0NVZSz3FF9PiXz3dDQSgSsGFWD20cZCr4QBXr0fEKj0viWS1ruMxzNKc7pT4J',
  heroBgUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALo7AYpGrTtj3q50TYMDLjbMR3Ihe3y6s-E2i_e5E9ZnL1QVM5lVrNBf7DRjt-OgnPauodIZuqr1P4WSRfczCkZ0J7Zt8a2nDQ-O9_eTAdQExUcQSBsL4Tu1HmwCtgih9APx6aO8fVhqNCQ0JIPpc7iIFdjaS0KZfLjbhpaLhZOpYGtox1fMbV6IlMVDe_v6cIBGmEyAe9Wv4m1bIEKbf3QmJ8MgvjhROVDbi5HgSpcDZ_Tpzzjo-N2rpJgU1_b1w2vFvWj3H_GSg8',
  mascotWaveUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDjKpJcQOqcHl_3eSgBYaEu0hE_BRm2Yd7ei6zpCPtI6VaETvP1RtXv-Bq5i2lI7kO-bR90Z7it2OM3dhpE4KzR4n-9OtRnDQPVZQC8-BxC_EDP34COxvw9DuDLbMDPF9YEzJpD6NPwq-OOs2TrgDAmLQ-Gb4ZMTWj-0bch4vMIolwrYfe513Qbt9obKTiqOx3VISJw-gL_ozwY2z8fGsrhQAe-T-Mm72rO0ssGydQ0XP2oVHJ575Hs6BnaWWp3LjYno7rNNnBVTv',
  mapUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQx2u20oFPQmFFh3AlgbDN28pQsARZwZV05LO4HDqpR-2Xui2EeNaDchL9DB1zDpzZF0NjXKrnGga8FqD1TISK_D6NKvl8UwT_e3rnYC8SAHElxNABdpGgyf3SVbeSpdFZRFj2gAsMsy4Zud8qwQbG7FJgrPrKRXynvM19GvzDrOizzElXAg8DsD6o0NEIn6aWASy311gBfn-MDsx9fPTbKPk-pu__BPOx2ln-5Pr2vvNtBuNhtozZNinhwEjXhSDFIA1eG22Gnj84',
  aboutInteriorUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvdWTmIDdyss-3iRJsRML2VFipBqFD1ipUxKjWC0_4b6jc1PwfiVvyujJlPdXtNdIWHzR0Wok6NNc85kczKRchZ04Ij0tYt01tGa1QVv3PaBlrc1Z0e8VfwONc0JU2Gcot4Tnc3IqdJYq1VYzzal-Xb2Pi_An-7kwQ6yMOEyxO2MYcbRoS1ShmEVqAj5h52RCltKUBlp7umXS5i4gIb3MbyWRPyf_3pdUw3B01ANh5x7R7NvgnSmu5SsgnbcssvoJH96PsLQ_DGQf0',
  baristaPourUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-K1SultitrYOVcFz7YP_v3rNMxIVwco_O2CKYBiH-pvmJY0Wm0SY_slYekZV0Ig59UUNt9IMSZVeH2qtFFx6wxp6Mrv6OJoMO-Wj8WTWMnKGWNjXufZE4RBeiIbaCYWeg6bH-9mThNlBF3yumR5-MVVtqGj9y-i2zjYnO8CqoW7e3ItqdbD-x66UxtYi2cNbfrADxkX_QFkI0jbbP_oh2E2yWHy5fyg7x2JEBmd8d8S_6dHmc1SfBFijtW8-VerMl6LrVhd2qfErm',
  roastBeansUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjwfV8n39QyjFvceF-DqjosBYqne1x1N-IpMJ1USG3TPoLPC6Zw0ChsJvoA5qgKTQPOWqrVeTv87i6Y1t0N_YvJu_SJkbAdku46qzOcWTifWdEOFPtfs6P85Jci7XXfSnoPWfYcDfYflwlgJYIk52N0jP1MlWXkBUWolTOtUoDZRUho4UEQCtpOh4_bkNmEFzEcMA7QBxJdUdUr4TrV5EHYoh5xedttWIitHcRfXvgGsU_wdlkVbNsZ_pk0E7y5k246EFqXI_j0bLP',
  mistyForestUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIY0ktSQAqhTCC1f_i3GgS4I3_GKVJpkbskRGADcevPe5louBeNX4eyO1itvXkvc7uFr_R7KDBcgTfjdOX3wqQ756AzcujTyzSv3f-ApzXq_ABJ3qdz51YxdEBtqDPz80q6J79CLjr6YvYVkNdFpL3jMdcspbcHZb4Yo15BW0YPoD2UwZ_LCDd2EAulj_t2db-sgO3cHpjvwAUC2XsF66yrEuw9ZlE3OTynxSaJwBQrTUf5WskbPYgH5RUZv9uZmPcUaop_PD-O8O0',
  instagramPhotos: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8wxrBDJPwJa5KX3NqoOjsGS7BPGA3Wg3n_tZkLlNE4ANBbMbNfMMJAiP03heVTQC3J5QmNpWrf7jMikHf95uhsWigcvOwjEiqcdEos0mAvQmoc7dh71Jau8F-I50k7o7xQ-Me99TjLp6HauTiptgVlqEBis9gdrPs41NS4MeY4UUEPnxro3CYdtrR5HNwE3j7BOAaoLZtvFqSPIrAJ5XROMPExr-dv6Ppy7D78CcRBMC7LJH7RmT4Vt1j49VIPHuxBanG9CtKetax',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBl4qJnelp-ZDz_rI_1ui582cy9c1eWC_RuUHR5lvvySjgQ_sTig__9dYB4bJEw6GwdBgQdEoSdyv729KztQ1yexquwirIzY0MGfFEv-TPg0ZIvnQSQlC9P7m1YwhsNYeCrxlLH2gcVBOwzdyQyS5MWxT-M7YTgyNTQWYS7XcYSoalQhLil1hZBKC6U25GwAU0a9qnWY06pbHoFzCPIoMwQbEqdTeDhxxhROSeOUVWTKduJkrndu3fAwaSGD4BdlQJl5J1gz0D96ixe',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCGcvLAp_Nyf_U5r2v41Vk7xNi1f6_b6kUZPyiS5__-SOfm9ADAMuD1ZtkXrJZ9H8l2Wb-zIaM9vSJej2bsv0CNu0zimpvP21O0ch3sPAyqs8wsv9UO4YUUr9s1oh2xaRbgJiexHA4kOWfAnXQfQ9zZkeqKnmf1p6nou_ncgw0rzca8cTMna3IQB6kX6X3aN-0kV60WcwcZ0nUn7P_Cp_ucorRF5Ivpkm9RNPiPar9tMuqPswaqMeqfvbTs-k5-JdbftBOlmCjTebc0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBexxynEi7IAGl4ezjFJnAaU5ZwULs1isOaOTC37lHKxyEhbeVGKXfot0lSfNEOF0DlhLzoWr8oahysL-th-pHYfpncvR2klmTl0-2f_IX4L6JvOu2HsUeVozkaC2r9Mfr06jgEqGcgNJy4xb5Ca5OX8TxFzEzzOPbs2oZ2AhEzhj1S927V7SAtmSoGmC_YwK8mKTN2MTXFPXYtHbtZUTwChPxvEH5N06x5TjMRUbUiNqtF6XPbt95TwXOJTVtayDjfbWeP9kMETWpr',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD0kI8SacW4Fnr8ozzHLd_9OO8612bSNv8IrVJ1I8JBCeFlBbLYwOMhng8qkCLumhtGtk3k7yMaN4WDUVZSe-W_2gbh_nHZwqgeItvkWKMiCoRvaCKXdeGbLxQBWd6lw5ex8HBR9UzgB4PQ1-SipPH1YwxXyJRDwCQPdQmE19Qnu2C01DxWCsJh744wn_RGQ_gvrs1KsKII6Kl7wSnvnRNUKfjNl8B-NuHOkQRGLrg5bRM7d8l7dZlAvdOIjAINs6JQx_e5o2-CFR7N',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDLRS3rCyw-FvenQ_N592V7AGVdyt2hAYJ7A_DzPpTki7YJpOBE1d4etS88VWFNwGY_Da0KBv20lRoJEYudUjccl0ccUe9GP_7seb7JVc9_uzXuae7khBgc4WSEg8N7ZSDrQbnSbTsZ2Pe3Q4YYJTMI0gqx2WleIIfVBiiokcd0kUrUtc9uwnNPH1C1rKgKp_O1lROX9pVTlbsPgpFQejEb_8Yk2YinfeXi6xDchjH1eOh-jPxzdg54h7cDkzHP-IL1V590c_4iX7Pw'
  ],
  contact: {
    address: '742 Evergreen Glen, Forest Edge Drive, Pine Sanctuary',
    hours: 'Monday - Sunday: 7:00 AM - 9:00 PM',
    kitchenNote: 'Kitchen closes at 8:30 PM',
    phone: '+1 (555) 742-PINE',
    email: 'hello@meltarocafe.com'
  }
};

/* ------------------------------------------------------------------ */
/* Seed execution                                                       */
/* ------------------------------------------------------------------ */

async function seed() {
  console.log('🌱 Connecting to MongoDB Atlas…');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected.\n');

  // Menu items — upsert by _id
  console.log('📋 Seeding menu items…');
  for (const item of MENU_ITEMS) {
    await MenuItem.findByIdAndUpdate(item._id, item, { upsert: true, new: true });
  }
  console.log(`   ✓ ${MENU_ITEMS.length} menu items upserted`);

  // Categories
  console.log('🏷️  Seeding categories…');
  await Category.deleteMany({});
  await Category.insertMany(CATEGORIES);
  console.log(`   ✓ ${CATEGORIES.length} categories`);

  // Reviews
  console.log('⭐ Seeding reviews…');
  await Review.deleteMany({});
  await Review.insertMany(REVIEWS);
  console.log(`   ✓ ${REVIEWS.length} reviews`);

  // Site content (singleton)
  console.log('🖼️  Seeding site content…');
  await SiteContent.findByIdAndUpdate(SITE_CONTENT_SINGLETON_ID, SITE_CONTENT, { upsert: true, new: true });
  console.log('   ✓ Site content upserted');

  // Admin user
  console.log('👤 Seeding admin user…');
  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL });
  if (existing) {
    console.log(`   ℹ️  Admin already exists: ${env.ADMIN_EMAIL} — skipping (delete manually to reset)`);
  } else {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await Admin.create({ email: env.ADMIN_EMAIL, passwordHash, name: 'Café Owner' });
    console.log(`   ✓ Admin created: ${env.ADMIN_EMAIL}`);
  }

  console.log('\n🎉 Seed complete!\n');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
