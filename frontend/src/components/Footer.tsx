import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-neutral-900 text-neutral-300 border-t border-neutral-800 pt-16 pb-12 text-xs"
      data-testid="store-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Manifesto */}
        <div className="pb-12 border-b border-neutral-800 mb-12 text-center max-w-2xl mx-auto">
          <p className="font-serif text-2xl tracking-[0.25em] text-white uppercase font-light mb-4">
            MANGO
          </p>
          <p className="text-neutral-400 font-light leading-relaxed tracking-wider text-xs sm:text-sm">
            Curated contemporary silhouettes designed for effortless elegance and timeless versatility.
            Elevating modern womenswear through tailored form, intentional textiles, and refined simplicity.
          </p>
        </div>

        {/* Navigation & Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-800">
          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-medium mb-4">
              The Edit
            </h4>
            <ul className="space-y-2.5 text-neutral-400">
              <li><span className="hover:text-white cursor-pointer transition-colors">New Arrivals</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Dresses & Jumpsuits</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Party & Evening</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Office Tailoring</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Fine Knitwear</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-medium mb-4">
              Editorial
            </h4>
            <ul className="space-y-2.5 text-neutral-400">
              <li><span className="hover:text-white cursor-pointer transition-colors">Autumn/Winter Campaign</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Fabric Transparency</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Style & Proportions</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Curated Lookbook</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-medium mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-neutral-400">
              <li><span className="hover:text-white cursor-pointer transition-colors">Size Guide & Fit</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Retailer Direct Ordering</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Shipping & Returns</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Contact Editorial Team</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-medium mb-4">
              Affiliate Partnership
            </h4>
            <p
              className="text-neutral-400 text-[11px] leading-relaxed font-light"
              data-testid="affiliate-disclosure"
            >
              This catalog features handpicked editorial selections from authorized retail partners.
              When you click outbound affiliate links and make a qualifying purchase, we may receive
              a commission at no extra cost to you. All product pricing and inventory are maintained
              directly by MANGO and verified partners.
            </p>
          </div>
        </div>

        {/* Bottom Strip: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px] gap-4">
          <p>© {new Date().getFullYear()} MANGO Editorial Fashion Affiliate. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-neutral-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-neutral-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-neutral-300 cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
