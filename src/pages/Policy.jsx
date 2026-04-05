import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './Policy.css';

const policyContent = {
    privacidade: {
        title: 'Política de Privacidade',
        lastUpdated: 'Janeiro 2024',
        sections: [
            {
                heading: '1. Informações que Recolhemos',
                content: 'Recolhemos informações que nos fornece diretamente, como nome, email, morada de envio e informações de pagamento quando efetua uma compra. Também recolhemos informações sobre a sua utilização do site através de cookies e tecnologias semelhantes.'
            },
            {
                heading: '2. Como Utilizamos as Suas Informações',
                content: 'Utilizamos as suas informações para processar encomendas, comunicar consigo sobre a sua compra, melhorar os nossos serviços e, com o seu consentimento, enviar-lhe comunicações de marketing sobre novos produtos e ofertas.'
            },
            {
                heading: '3. Partilha de Informações',
                content: 'Não vendemos as suas informações pessoais. Partilhamos informações apenas com prestadores de serviços necessários para processar a sua encomenda (como serviços de pagamento e envio) e quando exigido por lei.'
            },
            {
                heading: '4. Segurança',
                content: 'Implementamos medidas de segurança técnicas e organizacionais para proteger as suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.'
            },
            {
                heading: '5. Os Seus Direitos',
                content: 'Tem o direito de aceder, corrigir ou eliminar as suas informações pessoais. Pode também opor-se ao processamento dos seus dados ou solicitar a portabilidade dos mesmos. Para exercer estes direitos, contacte-nos através de ola@lyra.pt.'
            },
            {
                heading: '6. Cookies',
                content: 'Utilizamos cookies para melhorar a sua experiência no site. Pode gerir as suas preferências de cookies nas definições do seu navegador.'
            }
        ]
    },
    termos: {
        title: 'Termos e Condições',
        lastUpdated: 'Janeiro 2024',
        sections: [
            {
                heading: '1. Aceitação dos Termos',
                content: 'Ao aceder e utilizar o site LYRA, concorda com estes termos e condições. Se não concordar com qualquer parte destes termos, não deve utilizar o nosso site.'
            },
            {
                heading: '2. Produtos e Preços',
                content: 'Todos os produtos estão sujeitos a disponibilidade. Reservamo-nos o direito de limitar quantidades e descontinuar produtos. Os preços estão sujeitos a alterações sem aviso prévio.'
            },
            {
                heading: '3. Encomendas e Pagamento',
                content: 'Ao fazer uma encomenda, está a fazer uma oferta para comprar os produtos. Reservamo-nos o direito de recusar ou cancelar qualquer encomenda. O pagamento deve ser efetuado no momento da encomenda através dos métodos disponíveis.'
            },
            {
                heading: '4. Envios',
                content: 'Os prazos de entrega são estimativas e não garantias. Não nos responsabilizamos por atrasos causados por transportadoras ou circunstâncias fora do nosso controlo.'
            },
            {
                heading: '5. Devoluções e Reembolsos',
                content: 'Aceitamos devoluções de produtos não utilizados e selados dentro de 14 dias após a receção. Os custos de envio de devolução são da responsabilidade do cliente, exceto em caso de produto defeituoso.'
            },
            {
                heading: '6. Propriedade Intelectual',
                content: 'Todo o conteúdo do site, incluindo textos, imagens, logótipos e design, é propriedade da LYRA e está protegido por direitos de autor.'
            },
            {
                heading: '7. Limitação de Responsabilidade',
                content: 'A LYRA não se responsabiliza por danos indiretos, incidentais ou consequenciais resultantes da utilização dos nossos produtos ou serviços.'
            }
        ]
    },
    envios: {
        title: 'Política de Envios e Devoluções',
        lastUpdated: 'Janeiro 2024',
        sections: [
            {
                heading: '1. Métodos de Envio',
                content: 'Enviamos para todo o território de Portugal Continental e Ilhas através de transportadoras certificadas. Oferecemos envio standard (2-3 dias úteis) e envio expresso (1-2 dias úteis).'
            },
            {
                heading: '2. Custos de Envio',
                content: 'Envio grátis para encomendas acima de 50€ em Portugal Continental. Para encomendas inferiores, o custo de envio é de 4,95€. Envios para as Ilhas têm um custo adicional de 2€.'
            },
            {
                heading: '3. Processamento de Encomendas',
                content: 'As encomendas são processadas em 1-2 dias úteis. Receberá um email de confirmação com o número de rastreamento assim que a encomenda for enviada.'
            },
            {
                heading: '4. Rastreamento',
                content: 'Todas as encomendas incluem rastreamento. Pode acompanhar o estado da sua encomenda através do link fornecido no email de envio.'
            },
            {
                heading: '5. Política de Devoluções',
                content: 'Aceitamos devoluções de produtos não utilizados e na embalagem original dentro de 14 dias após a receção. Por razões de higiene, produtos abertos ou utilizados não podem ser devolvidos.'
            },
            {
                heading: '6. Como Devolver',
                content: 'Para iniciar uma devolução, contacte-nos através de ola@lyra.pt com o número da encomenda. Forneceremos instruções detalhadas e, se aplicável, uma etiqueta de devolução.'
            },
            {
                heading: '7. Reembolsos',
                content: 'Os reembolsos são processados dentro de 5-7 dias úteis após recebermos e inspecionarmos o produto devolvido. O valor será creditado no método de pagamento original.'
            },
            {
                heading: '8. Produtos Danificados ou Defeituosos',
                content: 'Se receber um produto danificado ou defeituoso, contacte-nos imediatamente. Providenciaremos uma substituição ou reembolso total, incluindo custos de envio.'
            }
        ]
    }
};

const Policy = () => {
    const { type } = useParams();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const policy = policyContent[type] || policyContent.privacidade;

    return (
        <div className="app">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="policy-page">
                <div className="container">
                    <div className="policy-header">
                        <h1>{policy.title}</h1>
                        <p className="policy-updated">Última atualização: {policy.lastUpdated}</p>
                    </div>

                    <div className="policy-content">
                        {policy.sections.map((section, index) => (
                            <section key={index} className="policy-section">
                                <h2>{section.heading}</h2>
                                <p>{section.content}</p>
                            </section>
                        ))}
                    </div>

                    <div className="policy-contact">
                        <h3>Questões?</h3>
                        <p>Se tiver alguma dúvida sobre esta política, contacte-nos através de <a href="mailto:ola@lyra.pt">ola@lyra.pt</a></p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Policy;
