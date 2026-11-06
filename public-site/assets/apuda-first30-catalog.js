(function(global){
  'use strict';
  // Shared cover/guide identity for the homepage shelf, resource chooser and video resources.
  // FAQ: 30 cancer types, 100 questions each; Vol.13–30 Q21–100 are AI drafts pending clinician review.
  var books=[
  {
    "vol": 1,
    "slug": "breast",
    "name": "유방암",
    "cover": "/assets/books/first30/breast.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/01.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 2,
    "slug": "lung",
    "name": "폐암",
    "cover": "/assets/books/first30/lung.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/02.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 3,
    "slug": "stomach",
    "name": "위암",
    "cover": "/assets/books/first30/stomach.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/03.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 4,
    "slug": "colorectal",
    "name": "대장암",
    "cover": "/assets/books/first30/colorectal.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/04.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 5,
    "slug": "thyroid",
    "name": "갑상선암",
    "cover": "/assets/books/first30/thyroid.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/05.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 6,
    "slug": "kidney",
    "name": "신장암",
    "cover": "/assets/books/first30/kidney.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/06.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 7,
    "slug": "prostate",
    "name": "전립선암",
    "cover": "/assets/books/first30/prostate.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/07.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 8,
    "slug": "pancreas",
    "name": "췌장암",
    "cover": "/assets/books/first30/pancreas.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/08.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 9,
    "slug": "biliary",
    "name": "담도암",
    "cover": "/assets/books/first30/biliary.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/09.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 10,
    "slug": "liver",
    "name": "간암",
    "cover": "/assets/books/first30/liver.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/10.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 11,
    "slug": "lymphoma",
    "name": "림프종",
    "cover": "/assets/books/first30/lymphoma.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/11.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 12,
    "slug": "cervical",
    "name": "자궁경부암",
    "cover": "/assets/books/first30/cervical.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/12.html",
    "hasMini": true,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 13,
    "slug": "ovarian",
    "name": "난소암",
    "cover": "/assets/books/first30/ovarian.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/13.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 14,
    "slug": "endometrial",
    "name": "자궁내막암",
    "cover": "/assets/books/first30/endometrial.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/14.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 15,
    "slug": "esophageal",
    "name": "식도암",
    "cover": "/assets/books/first30/esophageal.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/15.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 16,
    "slug": "bladder",
    "name": "방광암",
    "cover": "/assets/books/first30/bladder.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/16.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 17,
    "slug": "testicular",
    "name": "고환암",
    "cover": "/assets/books/first30/testicular.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/17.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 18,
    "slug": "oral",
    "name": "구강암",
    "cover": "/assets/books/first30/oral.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/18.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 19,
    "slug": "laryngeal",
    "name": "후두암",
    "cover": "/assets/books/first30/laryngeal.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/19.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 20,
    "slug": "nasopharyngeal",
    "name": "비인두암",
    "cover": "/assets/books/first30/nasopharyngeal.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/20.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 21,
    "slug": "melanoma",
    "name": "악성 흑색종",
    "cover": "/assets/books/first30/melanoma.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/21.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 22,
    "slug": "sarcoma",
    "name": "연부조직육종",
    "cover": "/assets/books/first30/sarcoma.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/22.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 23,
    "slug": "brain",
    "name": "성인 악성 뇌종양",
    "cover": "/assets/books/first30/brain.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/23.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 24,
    "slug": "myeloma",
    "name": "다발성골수종",
    "cover": "/assets/books/first30/myeloma.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/24.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 25,
    "slug": "aml",
    "name": "급성골수성백혈병",
    "cover": "/assets/books/first30/aml.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/25.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 26,
    "slug": "all",
    "name": "급성림프모구백혈병",
    "cover": "/assets/books/first30/all.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/26.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 27,
    "slug": "cml",
    "name": "만성골수성백혈병",
    "cover": "/assets/books/first30/cml.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/27.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 28,
    "slug": "hodgkin",
    "name": "호지킨림프종",
    "cover": "/assets/books/first30/hodgkin.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/28.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 29,
    "slug": "pcnsl",
    "name": "원발성 중추신경계 림프종",
    "cover": "/assets/books/first30/pcnsl.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/29.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  },
  {
    "vol": 30,
    "slug": "cup",
    "name": "원발불명암",
    "cover": "/assets/books/first30/cup.webp?v=20261105-landscape-v2",
    "href": "/library/first30/books/30.html",
    "hasMini": false,
    "hasFaq": true,
    "faqCount": 100
  }
];
  var bySlug=Object.create(null);
  books.forEach(function(book){Object.freeze(book);bySlug[book.slug]=book;});
  function get(value){var slug=String(value||'').trim().toLowerCase();if(slug==='pancreatic')slug='pancreas';return bySlug[slug]||null;}
  global.ApuDaFirst30Catalog=Object.freeze({books:Object.freeze(books),get:get});
})(window);

