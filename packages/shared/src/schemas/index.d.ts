import { z } from 'zod';
export declare const BodyMeasurementsSchema: z.ZodObject<{
    height: z.ZodNumber;
    weight: z.ZodNumber;
    chest: z.ZodOptional<z.ZodNumber>;
    waist: z.ZodOptional<z.ZodNumber>;
    hips: z.ZodOptional<z.ZodNumber>;
    inseam: z.ZodOptional<z.ZodNumber>;
    shoulderWidth: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    height: number;
    weight: number;
    chest?: number | undefined;
    waist?: number | undefined;
    hips?: number | undefined;
    inseam?: number | undefined;
    shoulderWidth?: number | undefined;
}, {
    height: number;
    weight: number;
    chest?: number | undefined;
    waist?: number | undefined;
    hips?: number | undefined;
    inseam?: number | undefined;
    shoulderWidth?: number | undefined;
}>;
export declare const StyleEnum: z.ZodEnum<["casual", "formal", "streetwear", "business", "athletic", "bohemian", "minimalist", "vintage"]>;
export declare const OccasionEnum: z.ZodEnum<["work", "date", "party", "gym", "travel", "wedding", "casual", "outdoor"]>;
export declare const BudgetEnum: z.ZodEnum<["budget", "mid", "luxury"]>;
export declare const GenderEnum: z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>;
export declare const UserPreferencesSchema: z.ZodObject<{
    styles: z.ZodArray<z.ZodEnum<["casual", "formal", "streetwear", "business", "athletic", "bohemian", "minimalist", "vintage"]>, "many">;
    colors: z.ZodArray<z.ZodString, "many">;
    avoidColors: z.ZodArray<z.ZodString, "many">;
    occasions: z.ZodArray<z.ZodEnum<["work", "date", "party", "gym", "travel", "wedding", "casual", "outdoor"]>, "many">;
    budget: z.ZodEnum<["budget", "mid", "luxury"]>;
    gender: z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>;
    brands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avoidBrands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    budget: "budget" | "mid" | "luxury";
    styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
    colors: string[];
    avoidColors: string[];
    occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
    gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
    brands?: string[] | undefined;
    avoidBrands?: string[] | undefined;
}, {
    budget: "budget" | "mid" | "luxury";
    styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
    colors: string[];
    avoidColors: string[];
    occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
    gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
    brands?: string[] | undefined;
    avoidBrands?: string[] | undefined;
}>;
export declare const LocationSchema: z.ZodObject<{
    city: z.ZodString;
    country: z.ZodString;
    lat: z.ZodNumber;
    lon: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    city: string;
    country: string;
    lat: number;
    lon: number;
}, {
    city: string;
    country: string;
    lat: number;
    lon: number;
}>;
export declare const DailyQuotaSchema: z.ZodObject<{
    date: z.ZodString;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    count: number;
}, {
    date: string;
    count: number;
}>;
export declare const UserProfileSchema: z.ZodObject<{
    _id: z.ZodString;
    clerkUserId: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodString;
    measurements: z.ZodOptional<z.ZodObject<{
        height: z.ZodNumber;
        weight: z.ZodNumber;
        chest: z.ZodOptional<z.ZodNumber>;
        waist: z.ZodOptional<z.ZodNumber>;
        hips: z.ZodOptional<z.ZodNumber>;
        inseam: z.ZodOptional<z.ZodNumber>;
        shoulderWidth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    }, {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        styles: z.ZodArray<z.ZodEnum<["casual", "formal", "streetwear", "business", "athletic", "bohemian", "minimalist", "vintage"]>, "many">;
        colors: z.ZodArray<z.ZodString, "many">;
        avoidColors: z.ZodArray<z.ZodString, "many">;
        occasions: z.ZodArray<z.ZodEnum<["work", "date", "party", "gym", "travel", "wedding", "casual", "outdoor"]>, "many">;
        budget: z.ZodEnum<["budget", "mid", "luxury"]>;
        gender: z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>;
        brands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        avoidBrands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    }, {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    }>>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodString;
        country: z.ZodString;
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        city: string;
        country: string;
        lat: number;
        lon: number;
    }, {
        city: string;
        country: string;
        lat: number;
        lon: number;
    }>>;
    dailyQuota: z.ZodObject<{
        date: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        count: number;
    }, {
        date: string;
        count: number;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    clerkUserId: string;
    createdAt: Date;
    _id: string;
    email: string;
    displayName: string;
    dailyQuota: {
        date: string;
        count: number;
    };
    updatedAt: Date;
    measurements?: {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    } | undefined;
    preferences?: {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    } | undefined;
    location?: {
        city: string;
        country: string;
        lat: number;
        lon: number;
    } | undefined;
}, {
    clerkUserId: string;
    createdAt: Date;
    _id: string;
    email: string;
    displayName: string;
    dailyQuota: {
        date: string;
        count: number;
    };
    updatedAt: Date;
    measurements?: {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    } | undefined;
    preferences?: {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    } | undefined;
    location?: {
        city: string;
        country: string;
        lat: number;
        lon: number;
    } | undefined;
}>;
export declare const ClothingCategoryEnum: z.ZodEnum<["top", "bottom", "shoes", "outerwear", "accessory", "dress", "suit"]>;
export declare const ClothingItemSchema: z.ZodObject<{
    category: z.ZodEnum<["top", "bottom", "shoes", "outerwear", "accessory", "dress", "suit"]>;
    name: z.ZodString;
    description: z.ZodString;
    color: z.ZodString;
    material: z.ZodOptional<z.ZodString>;
    style: z.ZodString;
    priceRange: z.ZodEnum<["budget", "mid", "luxury"]>;
    searchTerms: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    style: string;
    category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
    name: string;
    description: string;
    color: string;
    priceRange: "budget" | "mid" | "luxury";
    searchTerms: string[];
    material?: string | undefined;
}, {
    style: string;
    category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
    name: string;
    description: string;
    color: string;
    priceRange: "budget" | "mid" | "luxury";
    searchTerms: string[];
    material?: string | undefined;
}>;
export declare const WeatherContextSchema: z.ZodObject<{
    temp: z.ZodNumber;
    condition: z.ZodString;
    humidity: z.ZodNumber;
    windSpeed: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
}, {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
}>;
export declare const OutfitSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<["top", "bottom", "shoes", "outerwear", "accessory", "dress", "suit"]>;
        name: z.ZodString;
        description: z.ZodString;
        color: z.ZodString;
        material: z.ZodOptional<z.ZodString>;
        style: z.ZodString;
        priceRange: z.ZodEnum<["budget", "mid", "luxury"]>;
        searchTerms: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }, {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }>, "many">;
    stylingTips: z.ZodArray<z.ZodString, "many">;
    colorPalette: z.ZodArray<z.ZodString, "many">;
    confidenceScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    items: {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }[];
    stylingTips: string[];
    colorPalette: string[];
    confidenceScore: number;
}, {
    title: string;
    description: string;
    items: {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }[];
    stylingTips: string[];
    colorPalette: string[];
    confidenceScore: number;
}>;
export declare const ImageStatusEnum: z.ZodEnum<["pending", "generating", "ready", "failed"]>;
export declare const AIProviderEnum: z.ZodEnum<["gemini", "openai", "cached"]>;
export declare const OutfitRecommendationSchema: z.ZodObject<{
    _id: z.ZodString;
    userId: z.ZodString;
    requestHash: z.ZodString;
    occasion: z.ZodString;
    weatherContext: z.ZodObject<{
        temp: z.ZodNumber;
        condition: z.ZodString;
        humidity: z.ZodNumber;
        windSpeed: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
    }, {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
    }>;
    outfit: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            category: z.ZodEnum<["top", "bottom", "shoes", "outerwear", "accessory", "dress", "suit"]>;
            name: z.ZodString;
            description: z.ZodString;
            color: z.ZodString;
            material: z.ZodOptional<z.ZodString>;
            style: z.ZodString;
            priceRange: z.ZodEnum<["budget", "mid", "luxury"]>;
            searchTerms: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            style: string;
            category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
            name: string;
            description: string;
            color: string;
            priceRange: "budget" | "mid" | "luxury";
            searchTerms: string[];
            material?: string | undefined;
        }, {
            style: string;
            category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
            name: string;
            description: string;
            color: string;
            priceRange: "budget" | "mid" | "luxury";
            searchTerms: string[];
            material?: string | undefined;
        }>, "many">;
        stylingTips: z.ZodArray<z.ZodString, "many">;
        colorPalette: z.ZodArray<z.ZodString, "many">;
        confidenceScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        items: {
            style: string;
            category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
            name: string;
            description: string;
            color: string;
            priceRange: "budget" | "mid" | "luxury";
            searchTerms: string[];
            material?: string | undefined;
        }[];
        stylingTips: string[];
        colorPalette: string[];
        confidenceScore: number;
    }, {
        title: string;
        description: string;
        items: {
            style: string;
            category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
            name: string;
            description: string;
            color: string;
            priceRange: "budget" | "mid" | "luxury";
            searchTerms: string[];
            material?: string | undefined;
        }[];
        stylingTips: string[];
        colorPalette: string[];
        confidenceScore: number;
    }>;
    imageUrl: z.ZodOptional<z.ZodString>;
    imageStatus: z.ZodEnum<["pending", "generating", "ready", "failed"]>;
    aiProvider: z.ZodEnum<["gemini", "openai", "cached"]>;
    cacheHit: z.ZodBoolean;
    feedback: z.ZodObject<{
        rating: z.ZodOptional<z.ZodEnum<["like", "dislike"]>>;
        savedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        rating?: "like" | "dislike" | undefined;
        savedAt?: Date | undefined;
    }, {
        rating?: "like" | "dislike" | undefined;
        savedAt?: Date | undefined;
    }>;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    userId: string;
    createdAt: Date;
    requestHash: string;
    expiresAt: Date;
    feedback: {
        rating?: "like" | "dislike" | undefined;
        savedAt?: Date | undefined;
    };
    occasion: string;
    _id: string;
    weatherContext: {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
    };
    outfit: {
        title: string;
        description: string;
        items: {
            style: string;
            category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
            name: string;
            description: string;
            color: string;
            priceRange: "budget" | "mid" | "luxury";
            searchTerms: string[];
            material?: string | undefined;
        }[];
        stylingTips: string[];
        colorPalette: string[];
        confidenceScore: number;
    };
    imageStatus: "pending" | "generating" | "ready" | "failed";
    aiProvider: "gemini" | "openai" | "cached";
    cacheHit: boolean;
    imageUrl?: string | undefined;
}, {
    userId: string;
    createdAt: Date;
    requestHash: string;
    expiresAt: Date;
    feedback: {
        rating?: "like" | "dislike" | undefined;
        savedAt?: Date | undefined;
    };
    occasion: string;
    _id: string;
    weatherContext: {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
    };
    outfit: {
        title: string;
        description: string;
        items: {
            style: string;
            category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
            name: string;
            description: string;
            color: string;
            priceRange: "budget" | "mid" | "luxury";
            searchTerms: string[];
            material?: string | undefined;
        }[];
        stylingTips: string[];
        colorPalette: string[];
        confidenceScore: number;
    };
    imageStatus: "pending" | "generating" | "ready" | "failed";
    aiProvider: "gemini" | "openai" | "cached";
    cacheHit: boolean;
    imageUrl?: string | undefined;
}>;
export declare const AICacheEntrySchema: z.ZodObject<{
    _id: z.ZodString;
    cacheKey: z.ZodString;
    requestType: z.ZodEnum<["outfit", "trend", "image", "weather"]>;
    response: z.ZodUnknown;
    ttlExpiresAt: z.ZodDate;
    hitCount: z.ZodNumber;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    createdAt: Date;
    cacheKey: string;
    ttlExpiresAt: Date;
    _id: string;
    requestType: "outfit" | "trend" | "image" | "weather";
    hitCount: number;
    response?: unknown;
}, {
    createdAt: Date;
    cacheKey: string;
    ttlExpiresAt: Date;
    _id: string;
    requestType: "outfit" | "trend" | "image" | "weather";
    hitCount: number;
    response?: unknown;
}>;
export declare const FeedbackSchema: z.ZodObject<{
    _id: z.ZodString;
    userId: z.ZodString;
    recommendationId: z.ZodString;
    rating: z.ZodEnum<["like", "dislike"]>;
    reason: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    userId: string;
    createdAt: Date;
    recommendationId: string;
    _id: string;
    rating: "like" | "dislike";
    reason?: string | undefined;
}, {
    userId: string;
    createdAt: Date;
    recommendationId: string;
    _id: string;
    rating: "like" | "dislike";
    reason?: string | undefined;
}>;
export declare const SetupProfileRequestSchema: z.ZodObject<{
    displayName: z.ZodString;
    email: z.ZodString;
    measurements: z.ZodOptional<z.ZodObject<{
        height: z.ZodNumber;
        weight: z.ZodNumber;
        chest: z.ZodOptional<z.ZodNumber>;
        waist: z.ZodOptional<z.ZodNumber>;
        hips: z.ZodOptional<z.ZodNumber>;
        inseam: z.ZodOptional<z.ZodNumber>;
        shoulderWidth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    }, {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        styles: z.ZodArray<z.ZodEnum<["casual", "formal", "streetwear", "business", "athletic", "bohemian", "minimalist", "vintage"]>, "many">;
        colors: z.ZodArray<z.ZodString, "many">;
        avoidColors: z.ZodArray<z.ZodString, "many">;
        occasions: z.ZodArray<z.ZodEnum<["work", "date", "party", "gym", "travel", "wedding", "casual", "outdoor"]>, "many">;
        budget: z.ZodEnum<["budget", "mid", "luxury"]>;
        gender: z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>;
        brands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        avoidBrands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    }, {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    }>>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodString;
        country: z.ZodString;
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        city: string;
        country: string;
        lat: number;
        lon: number;
    }, {
        city: string;
        country: string;
        lat: number;
        lon: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    measurements?: {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    } | undefined;
    preferences?: {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    } | undefined;
    location?: {
        city: string;
        country: string;
        lat: number;
        lon: number;
    } | undefined;
}, {
    email: string;
    displayName: string;
    measurements?: {
        height: number;
        weight: number;
        chest?: number | undefined;
        waist?: number | undefined;
        hips?: number | undefined;
        inseam?: number | undefined;
        shoulderWidth?: number | undefined;
    } | undefined;
    preferences?: {
        budget: "budget" | "mid" | "luxury";
        styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
        colors: string[];
        avoidColors: string[];
        occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
        gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
        brands?: string[] | undefined;
        avoidBrands?: string[] | undefined;
    } | undefined;
    location?: {
        city: string;
        country: string;
        lat: number;
        lon: number;
    } | undefined;
}>;
export declare const UpdateMeasurementsRequestSchema: z.ZodObject<{
    height: z.ZodNumber;
    weight: z.ZodNumber;
    chest: z.ZodOptional<z.ZodNumber>;
    waist: z.ZodOptional<z.ZodNumber>;
    hips: z.ZodOptional<z.ZodNumber>;
    inseam: z.ZodOptional<z.ZodNumber>;
    shoulderWidth: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    height: number;
    weight: number;
    chest?: number | undefined;
    waist?: number | undefined;
    hips?: number | undefined;
    inseam?: number | undefined;
    shoulderWidth?: number | undefined;
}, {
    height: number;
    weight: number;
    chest?: number | undefined;
    waist?: number | undefined;
    hips?: number | undefined;
    inseam?: number | undefined;
    shoulderWidth?: number | undefined;
}>;
export declare const UpdatePreferencesRequestSchema: z.ZodObject<{
    styles: z.ZodArray<z.ZodEnum<["casual", "formal", "streetwear", "business", "athletic", "bohemian", "minimalist", "vintage"]>, "many">;
    colors: z.ZodArray<z.ZodString, "many">;
    avoidColors: z.ZodArray<z.ZodString, "many">;
    occasions: z.ZodArray<z.ZodEnum<["work", "date", "party", "gym", "travel", "wedding", "casual", "outdoor"]>, "many">;
    budget: z.ZodEnum<["budget", "mid", "luxury"]>;
    gender: z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>;
    brands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avoidBrands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    budget: "budget" | "mid" | "luxury";
    styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
    colors: string[];
    avoidColors: string[];
    occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
    gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
    brands?: string[] | undefined;
    avoidBrands?: string[] | undefined;
}, {
    budget: "budget" | "mid" | "luxury";
    styles: ("casual" | "formal" | "streetwear" | "business" | "athletic" | "bohemian" | "minimalist" | "vintage")[];
    colors: string[];
    avoidColors: string[];
    occasions: ("casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor")[];
    gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
    brands?: string[] | undefined;
    avoidBrands?: string[] | undefined;
}>;
export declare const RecommendRequestSchema: z.ZodObject<{
    occasion: z.ZodEnum<["work", "date", "party", "gym", "travel", "wedding", "casual", "outdoor"]>;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
    }, {
        lat: number;
        lon: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    occasion: "casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor";
    location?: {
        lat: number;
        lon: number;
    } | undefined;
    description?: string | undefined;
}, {
    occasion: "casual" | "work" | "date" | "party" | "gym" | "travel" | "wedding" | "outdoor";
    location?: {
        lat: number;
        lon: number;
    } | undefined;
    description?: string | undefined;
}>;
export declare const FeedbackRequestSchema: z.ZodObject<{
    rating: z.ZodEnum<["like", "dislike"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: "like" | "dislike";
    reason?: string | undefined;
}, {
    rating: "like" | "dislike";
    reason?: string | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const AIOutfitOutputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<["top", "bottom", "shoes", "outerwear", "accessory", "dress", "suit"]>;
        name: z.ZodString;
        description: z.ZodString;
        color: z.ZodString;
        material: z.ZodOptional<z.ZodString>;
        style: z.ZodString;
        priceRange: z.ZodEnum<["budget", "mid", "luxury"]>;
        searchTerms: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }, {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }>, "many">;
    stylingTips: z.ZodArray<z.ZodString, "many">;
    colorPalette: z.ZodArray<z.ZodString, "many">;
    confidenceScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    items: {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }[];
    stylingTips: string[];
    colorPalette: string[];
    confidenceScore: number;
}, {
    title: string;
    description: string;
    items: {
        style: string;
        category: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "dress" | "suit";
        name: string;
        description: string;
        color: string;
        priceRange: "budget" | "mid" | "luxury";
        searchTerms: string[];
        material?: string | undefined;
    }[];
    stylingTips: string[];
    colorPalette: string[];
    confidenceScore: number;
}>;
export declare const AITrendOutputSchema: z.ZodObject<{
    trends: z.ZodArray<z.ZodObject<{
        trend: z.ZodString;
        description: z.ZodString;
        relevance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        trend: string;
        relevance: number;
    }, {
        description: string;
        trend: string;
        relevance: number;
    }>, "many">;
    location: z.ZodString;
    season: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    location: string;
    updatedAt: string;
    trends: {
        description: string;
        trend: string;
        relevance: number;
    }[];
    season: string;
}, {
    location: string;
    updatedAt: string;
    trends: {
        description: string;
        trend: string;
        relevance: number;
    }[];
    season: string;
}>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type BodyMeasurements = z.infer<typeof BodyMeasurementsSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type OutfitRecommendation = z.infer<typeof OutfitRecommendationSchema>;
export type AICacheEntry = z.infer<typeof AICacheEntrySchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type WeatherContext = z.infer<typeof WeatherContextSchema>;
export type Outfit = z.infer<typeof OutfitSchema>;
export type ClothingItem = z.infer<typeof ClothingItemSchema>;
export type AIOutfitOutput = z.infer<typeof AIOutfitOutputSchema>;
export type AITrendOutput = z.infer<typeof AITrendOutputSchema>;
export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;
export type SetupProfileRequest = z.infer<typeof SetupProfileRequestSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
//# sourceMappingURL=index.d.ts.map