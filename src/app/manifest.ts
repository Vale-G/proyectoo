import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return {name:"OmniFix Taller",short_name:"OmniFix",description:"Gestión de órdenes y reparaciones de OmniFix",start_url:"/",display:"standalone",background_color:"#090a0e",theme_color:"#16baf7",icons:[{src:"/brand/omnifix-original.jpg",sizes:"1024x1024",type:"image/jpeg"}]};}
