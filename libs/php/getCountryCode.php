<?php

    ini_set('display_errors', 'On');
    error_reporting(E_ALL);

    include('openCage/AbstractGeocoder.php');
    include('openCage/Geocoder.php');

    $geocoder = new \OpenCage\Geocoder\Geocoder('7ef3c76c6f434c5698560fe7de44753a');

    $result = $geocoder->geocode($_REQUEST['q']);

    if ($result['status']['code'] === 200) {
        
        $searchResult = [];
		$searchResult['results'] = [];

		$temp = [];

		foreach ($result['results'] as $entry) {

			$temp['source'] = 'opencage';
			$temp['formatted'] = $entry['formatted'];
			$temp['countryCode'] = strtoupper($entry['components']['country_code']);

			array_push($searchResult['results'], $temp);

		}

        
        //$country = strtoupper($results[0]['components']['country_code']);
        
        header('Content-Type: application/json; charset=UTF-8');
	
	    echo json_encode($searchResult, JSON_UNESCAPED_UNICODE);

    } else {    
        echo $result['status']['message'];
    }
    
?>