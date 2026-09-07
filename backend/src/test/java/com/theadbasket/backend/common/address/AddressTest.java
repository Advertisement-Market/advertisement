package com.theadbasket.backend.common.address;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class AddressTest {

    @Test
    @DisplayName("Address.of trims all whitespace and retains valid values")
    void addressOf_trimsValues() {
        Address address = Address.of(
                "  12 MG Road  ",
                "  Suite 400  ",
                "  Near Metro Gate 2  ",
                "  Bengaluru  ",
                "  Karnataka  ",
                "  560001  "
        );

        assertThat(address.getLine1()).isEqualTo("12 MG Road");
        assertThat(address.getLine2()).isEqualTo("Suite 400");
        assertThat(address.getLandmark()).isEqualTo("Near Metro Gate 2");
        assertThat(address.getCity()).isEqualTo("Bengaluru");
        assertThat(address.getState()).isEqualTo("Karnataka");
        assertThat(address.getPincode()).isEqualTo("560001");
    }

    @Test
    @DisplayName("Address.of converts empty and whitespace-only optional fields (line2, landmark) to null")
    void addressOf_convertsBlankOptionalFieldsToNull() {
        Address address = Address.of(
                "12 MG Road",
                "   ",
                "",
                "Bengaluru",
                "Karnataka",
                "560001"
        );

        assertThat(address.getLine1()).isEqualTo("12 MG Road");
        assertThat(address.getLine2()).isNull();
        assertThat(address.getLandmark()).isNull();
        assertThat(address.getCity()).isEqualTo("Bengaluru");
        assertThat(address.getState()).isEqualTo("Karnataka");
        assertThat(address.getPincode()).isEqualTo("560001");
    }

    @Test
    @DisplayName("Address.of handles null inputs safely")
    void addressOf_handlesNullInputs() {
        Address address = Address.of(null, null, null, null, null, null);

        assertThat(address.getLine1()).isNull();
        assertThat(address.getLine2()).isNull();
        assertThat(address.getLandmark()).isNull();
        assertThat(address.getCity()).isNull();
        assertThat(address.getState()).isNull();
        assertThat(address.getPincode()).isNull();
    }

    @Test
    @DisplayName("Parameterized constructor sets fields directly")
    void parameterizedConstructor_setsFields() {
        Address address = new Address("Line 1", "Line 2", "Landmark", "Mumbai", "Maharashtra", "400001");

        assertThat(address.getLine1()).isEqualTo("Line 1");
        assertThat(address.getLine2()).isEqualTo("Line 2");
        assertThat(address.getLandmark()).isEqualTo("Landmark");
        assertThat(address.getCity()).isEqualTo("Mumbai");
        assertThat(address.getState()).isEqualTo("Maharashtra");
        assertThat(address.getPincode()).isEqualTo("400001");
    }

    @Test
    @DisplayName("Setters and getters work as expected")
    void settersAndGetters() {
        Address address = new Address();
        Instant now = Instant.now();

        address.setLine1("Line 1");
        address.setLine2("Line 2");
        address.setLandmark("Landmark");
        address.setCity("Pune");
        address.setState("Maharashtra");
        address.setPincode("411001");
        address.setCreatedTs(now);
        address.setUpdatedTs(now);

        assertThat(address.getId()).isNull();
        assertThat(address.getLine1()).isEqualTo("Line 1");
        assertThat(address.getLine2()).isEqualTo("Line 2");
        assertThat(address.getLandmark()).isEqualTo("Landmark");
        assertThat(address.getCity()).isEqualTo("Pune");
        assertThat(address.getState()).isEqualTo("Maharashtra");
        assertThat(address.getPincode()).isEqualTo("411001");
        assertThat(address.getCreatedTs()).isEqualTo(now);
        assertThat(address.getUpdatedTs()).isEqualTo(now);
    }
}
