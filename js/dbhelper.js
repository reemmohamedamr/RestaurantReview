/**
 * Common database helper functions.
 */
class DBHelper {

  static get _dbPromise() {
    return DBHelper.openDatabase();
  }
  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static registerServiceWorker() {
    if (!navigator.serviceWorker) return;

    return navigator.serviceWorker.register('/sw.js');
  }
  /**
   * Fetch all restaurants.
   */
  static openDatabase() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    if(!idb)return;
    return idb.open('restaurants', 1, function (upgradeDb) {
      var store = upgradeDb.createObjectStore('restaurants', {
        /*treats the id property in the restaurants object
        as the primary key*/
        keyPath: 'id'
      });
      store.createIndex('by-date', 'createdAt');
    });
  }
  static reStoreRestaurants() {
    var tx = db.transaction('restaurants')
      .objectStore('restaurants').index('by-date');
    return tx.getAll().then(function (restaurants) {
      //DBHelper._restaurants = restaurants;
    });
  }


  static storeRestaurants(restaurants) {
    DBHelper._dbPromise.then(function (db) {
      if (!db) return;
      var tx = db.transaction('restaurants', 'readwrite');
      var store = tx.objectStore('restaurants');
      restaurants.then(rests => {
        rests.forEach(function (restaurant) {
          store.put(restaurant);
        });
        store.index('by-date');
      });
    });
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper._dbPromise.then(function (db) {
      if (!db) return;
      var tx = db.transaction('restaurants')
        .objectStore('restaurants').index('by-date');
      tx.getAll().then(function (restaurants) {
        return restaurants;
      }).then(function (restaurants) {
        if (!restaurants || restaurants.length<=0) {
          fetch(
            DBHelper.DATABASE_URL
          ).then(function (response) {
            const restaurants = response.json();
            DBHelper.storeRestaurants(restaurants);
            return restaurants;
          })
            .then(addRestaurants)
            .catch(e => requestError(`Request failed.`));

          function addRestaurants(restaurants) {
            callback(null, restaurants);
          }
          function requestError(error) {
            callback(error, null);
          }
        }else{
          return callback(null, restaurants);
        }
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return (`/img/${restaurant.photograph}.jpg`);
    } else {
      return (`/img/10.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }
}
