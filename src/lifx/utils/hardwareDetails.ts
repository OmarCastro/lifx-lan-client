import productDetailList from "./products.json.js";

type Product = {
    pid: number
    name: string
    features: {
      "color": boolean,
      "infrared": boolean,
      "multizone": boolean,
      "temperature_range": number[],
      "chain": boolean
    }
}

type FoundProductDetailsResult = {
    /** product info */
    product: Product
    vendor: typeof productDetailList[0],
    found: true
}

type NotFoundProductDetailsResult = {
    /** product info */
    product: null
    vendor: null,
    found: false
}

export type HardwareDetails = {
    vendorName: string,
    productName: string,
    productFeatures: Product["features"]

}

const findProductDetails = (() => {
    const resultMemo = {} as Record<number, Record<number, FoundProductDetailsResult>>

    return function(vendorId: number, productId: number) : FoundProductDetailsResult | NotFoundProductDetailsResult{
        const cachedResult = resultMemo[vendorId]?.[productId]
        if(cachedResult){
            return cachedResult
        }
        for (const productDetail of productDetailList) {
            if(productDetail.vid === vendorId){
                resultMemo[vendorId] ??= {}
                for (const product of productDetail.products) {
                    if(product.pid === productId){
                        const result: FoundProductDetailsResult = {product, vendor: productDetail, found: true}
                        resultMemo[vendorId][productId] = result
                        return result
                    }
                }
            }
        }
        return {product: null, vendor: null, found: false}
    }

})();

/**
 * Get's product and vendor details for the given id's
 * hsb integer object
 * @param {Number} vendorId id of the vendor
 * @param {Number} productId id of the product
 * @return {Object|Boolean} product and details vendor details or false if not found
 */
 export function getHardwareDetails (vendorId: number, productId: number): HardwareDetails | null {
    const productInfo = findProductDetails(vendorId, productId)
    if(productInfo.found){
        return {
            vendorName: productInfo.vendor.name,
            productName: productInfo.product.name,
            productFeatures: productInfo.product.features
          };
    }  
    return null;
  }

