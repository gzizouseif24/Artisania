import './ImageGrid.css';

const ImageGrid = () => {
  return (
    <div className="image-grid-container">
      <div className="image-grid-content">
        <div className="image-grid">
          <div
            className="image-grid-left"
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuChPgAqdfVl3UlEVdACsigJEg8rpp8Gj7rdTb3Yv5w5XsCTUGT9le68qh5SEMyRD6nSTefYX20xmEDP9JTV-RbOXRmTabzzNiLv39xyAcDwAez2MtPWsqfXZP40gP3pLnUEojE4-dvZ12XO9FiMwUZbiDJFxNZZQd3IxPsEmosNbybT5rdBo_5NMMF0hML2XvFuhh31Q5gr9lJJHFP0Pd7lqKneCn7yhIllMNUv3VmW_s8df6w_tT8ssjqv9pmh13QYHoGz7ejFQak")'}}
          ></div>
          <div
            className="image-grid-right"
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJS4-qAiTQ1mMx2KDQxhJ092uETJcm4KjKPb-Rz23HxOOjjF9eKBif1DFFV6MbVnI28c-Jkn-ghu044RhG8Jcy_6kxQ-ncLbWfdmZ2KyZJm9wdIwK-Yc5Y302ZD1TJ51rROLUva9vE_1e4oXltUMKzDeQWcE9qrqC-G9J0q1RHw7Ktk6pWniVvcaNLjJhdBbNJFTOtG13RincTYhEWvmqQ3MgpKzQf0gY6708Cc_DySxzVzcwBa1_64V7P4YgzAbLKih-E6DplG_4")'}}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ImageGrid; 