import React, { useState } from 'react';
import ProductSelection from '../components/client/ProductSelection';
import ContactModal from '../components/client/ContactModal';
import SuccessModal from '../components/client/SuccessModal';
import UserApplications from '../components/client/UserApplications';
import { useAuth } from '../context/AuthContext';
import './ClientPage.css';
import telegram from '../img/tg.png'
import whatsapp from '../img/wa.png'
import vkontakte from '../img/vk.png'
import odnoclassniki from '../img/ok.png'
import maks from '../img/maks.png'

const ClientPage = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleQuickOrder = () => {
    setActiveModal('contact');
  };

  const handleProductSelection = () => {
    setActiveModal('product');
  };

  const handleProductSubmit = (applicationData) => {
    console.log('Заявка из ProductSelection:', applicationData);
    setSuccessData(applicationData);
    setActiveModal(null);
    setShowSuccess(true);
  };

  const handleOrderSubmit = (contactInfo) => {
    console.log('Быстрый заказ:', contactInfo);
    setSuccessData({ contact: contactInfo });
    setActiveModal(null);
    setShowSuccess(true);
  };

  if (user && user.role === 'user') {
    return <UserApplications />;
  }

  return (
    <div className="client-page">
      <div class="main">
        <section class="half"></section>
        <section class="half">
          <div class="block">
            <div class="title">
              Подберите памятник и узнайте цены от проверенных мастеров
            </div>
            <div class="text">
              Мы пришлем вам варианты с ценами
            </div>
            <button class="button-order" onClick={handleProductSelection}>
              Выбрать памятник
            </button>
          </div>
          <button class="block2" onClick={handleQuickOrder}>
            <div class="phone"></div>
            <div class="title2">Нужна консультация?</div>
          </button>
        </section>
      </div>
      <div class="footer">
        <hr />
        <div class="social">
          <img src={telegram} alt='Telegram' />
          <img src={whatsapp} alt='WhatsApp' />
          <img src={vkontakte} alt='ВКонтакте' />
          <img src={odnoclassniki} alt='Одноклассники' />
          <img src={maks} alt='Макс' />
        </div>
        <div class="contact">
          Ритуальная справочная
        </div>
        <div class="contact">
          <p>&#9990; +7 (995) 53-777-28</p>
          <p>|</p>
          <p>&#9993; sm.art.em@yandex.ru</p>
        </div>
        <div class="year">2025</div>
      </div>

      {/* Модальные окна */}
      <ContactModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleOrderSubmit}
      />

      <ProductSelection
        isOpen={activeModal === 'product'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleProductSubmit} // Теперь это завершает весь процесс
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        applicationData={successData}
      />
    </div>
  );
};

export default ClientPage;